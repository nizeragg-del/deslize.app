import { NextResponse } from 'next/server'
import { stripe } from '@/utils/stripe/server'
import { getPlanByPriceId } from '@/utils/stripe/plans'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET as string)
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  // Use a service role key to bypass RLS in the webhook
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { error: eventInsertError } = await supabaseAdmin
      .from('stripe_webhook_events')
      .insert({
        id: event.id,
        event_type: event.type
      })

    if (eventInsertError) {
      if (eventInsertError.code === '23505') {
        return NextResponse.json({ received: true, duplicate: true })
      }

      console.error('Webhook idempotency insert failed:', eventInsertError)
      return NextResponse.json({ error: 'Webhook idempotency failed' }, { status: 500 })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.client_reference_id

        if (!userId) break

        // Retrieve the line items to know which plan was bought
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
        const priceId = lineItems.data[0]?.price?.id

        const planConfig = getPlanByPriceId(priceId)

        if (planConfig) {
          // Add transaction
          await supabaseAdmin.from('credit_transactions').insert({
            user_id: userId,
            amount: planConfig.credits,
            reason: 'plan_upgrade',
            stripe_session_id: session.id
          })

          // Fetch current profile to increment credits safely if we were doing it via JS
          // Better: use Postgres function or just update
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single()

          const currentCredits = profile?.credits || 0

          await supabaseAdmin.from('profiles').update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan: planConfig.plan,
            credits: currentCredits + planConfig.credits
          }).eq('id', userId)
        }

        break
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription
        const customerId = invoice.customer

        if (!subscriptionId) break

        // Buscar a assinatura para obter os metadados
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata?.userId
        const orderBump = subscription.metadata?.orderBump === 'true'

        if (!userId) {
          console.warn(`[Webhook] Nenhum userId encontrado nos metadados da assinatura ${subscriptionId}`)
          break
        }

        const invoicePriceId = invoice.lines?.data?.[0]?.price?.id
        const planConfig = getPlanByPriceId(invoicePriceId)

        if (!planConfig) {
          console.warn(`[Webhook] Preço não reconhecido na fatura ${invoice.id}`)
          break
        }

        let creditsToAdd = 0
        let reason = 'subscription_renewal'

        if (invoice.billing_reason === 'subscription_create') {
          creditsToAdd = planConfig.credits + (orderBump ? 20 : 0)
          reason = 'plan_upgrade'
        } else if (invoice.billing_reason === 'subscription_cycle') {
          creditsToAdd = planConfig.credits
          reason = 'subscription_renewal'
        }

        if (creditsToAdd > 0) {
          // Registrar transação de créditos
          await supabaseAdmin.from('credit_transactions').insert({
            user_id: userId,
            amount: creditsToAdd,
            reason: reason,
            stripe_session_id: invoice.id
          })

          // Obter perfil atual
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single()

          const currentCredits = profile?.credits || 0

          // Atualizar perfil
          await supabaseAdmin.from('profiles').update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan: planConfig.plan,
            credits: currentCredits + creditsToAdd
          }).eq('id', userId)

          console.log(`[Webhook] Processado pagamento para o usuário ${userId}. Plano: ${planConfig.plan}. Créditos adicionados: ${creditsToAdd}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const userId = subscription.metadata?.userId

        if (userId) {
          await supabaseAdmin.from('profiles').update({
            plan: 'free',
            stripe_subscription_id: null
          }).eq('id', userId)
          console.log(`[Webhook] Assinatura cancelada para o usuário ${userId}. Plano resetado para free.`)
        }
        break
      }


      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
