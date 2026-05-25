import { NextResponse } from 'next/server'
import { stripe, sanitizeEnvValue } from '@/utils/stripe/server'
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
        event_type: event.type,
        status: 'processing',
        error_message: null,
      })

    if (eventInsertError) {
      if (eventInsertError.code === '23505') {
        const { data: existingEvent } = await supabaseAdmin
          .from('stripe_webhook_events')
          .select('status')
          .eq('id', event.id)
          .single()

        if (existingEvent?.status === 'succeeded') {
          return NextResponse.json({ received: true, duplicate: true })
        }

        if (existingEvent?.status === 'processing') {
          return NextResponse.json({ error: 'Webhook already processing' }, { status: 409 })
        }

        await supabaseAdmin
          .from('stripe_webhook_events')
          .update({
            status: 'processing',
            error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', event.id)
          .neq('status', 'processing')
      }
      else {
        console.error('Webhook idempotency insert failed:', eventInsertError)
        return NextResponse.json({ error: 'Webhook idempotency failed' }, { status: 500 })
      }
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.client_reference_id

        if (!userId) break

        // Retrieve the line items to know which plan was bought
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
        const planPriceId = lineItems.data
          .map((item: any) => item.price?.id)
          .find((priceId: string | undefined) => getPlanByPriceId(priceId))

        const planConfig = getPlanByPriceId(planPriceId)

        if (planConfig) {
          await supabaseAdmin.rpc('add_credits', {
            p_user_id: userId,
            p_amount: planConfig.credits,
            p_reason: 'plan_upgrade',
            p_stripe_session_id: session.id
          })

          await supabaseAdmin.from('profiles').update({
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan: planConfig.plan
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

        if (!userId) {
          console.warn(`[Webhook] Nenhum userId encontrado nos metadados da assinatura ${subscriptionId}`)
          break
        }

        const invoiceLines = invoice.lines?.data || []
        const invoicePriceId = invoiceLines
          .map((line: any) => line.price?.id)
          .find((priceId: string | undefined) => getPlanByPriceId(priceId))
        const planConfig = getPlanByPriceId(invoicePriceId)

        if (!planConfig) {
          console.warn(`[Webhook] Preço não reconhecido na fatura ${invoice.id}`)
          break
        }

        const orderBumpPriceId = sanitizeEnvValue(process.env.STRIPE_PRICE_ORDER_BUMP)
        const hasPaidOrderBump = Boolean(
          orderBumpPriceId && invoiceLines.some((line: any) => line.price?.id === orderBumpPriceId)
        )

        let creditsToAdd = 0
        let reason = 'subscription_renewal'

        if (invoice.billing_reason === 'subscription_create') {
          creditsToAdd = planConfig.credits + (hasPaidOrderBump ? 20 : 0)
          reason = 'plan_upgrade'
        } else if (invoice.billing_reason === 'subscription_cycle') {
          creditsToAdd = planConfig.credits
          reason = 'subscription_renewal'
        }

        if (creditsToAdd > 0) {
          await supabaseAdmin.rpc('add_credits', {
            p_user_id: userId,
            p_amount: creditsToAdd,
            p_reason: reason,
            p_stripe_session_id: invoice.id
          })

          await supabaseAdmin.from('profiles').update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan: planConfig.plan
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

    await supabaseAdmin
      .from('stripe_webhook_events')
      .update({
        status: 'succeeded',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', event.id)

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    await supabaseAdmin
      .from('stripe_webhook_events')
      .update({
        status: 'failed',
        error_message: String(error?.message || error).slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq('id', event.id)

    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
