import { NextResponse } from 'next/server'
import { stripe, sanitizeEnvValue } from '@/utils/stripe/server'
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
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.client_reference_id

        if (!userId) break

        // Retrieve the line items to know which plan was bought
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
        const priceId = lineItems.data[0]?.price?.id

        let creditsToAdd = 0
        let newPlan = 'free'

        const starterPrice = sanitizeEnvValue(process.env.STRIPE_PRICE_STARTER)
        const proPrice = sanitizeEnvValue(process.env.STRIPE_PRICE_PRO)
        const agencyPrice = sanitizeEnvValue(process.env.STRIPE_PRICE_AGENCY)

        if (priceId === starterPrice) {
          creditsToAdd = 30
          newPlan = 'starter'
        } else if (priceId === proPrice) {
          creditsToAdd = 80
          newPlan = 'pro'
        } else if (priceId === agencyPrice) {
          creditsToAdd = 200
          newPlan = 'agency'
        }

        if (creditsToAdd > 0) {
          // Add transaction
          await supabaseAdmin.from('credit_transactions').insert({
            user_id: userId,
            amount: creditsToAdd,
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
            plan: newPlan,
            credits: currentCredits + creditsToAdd
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
        const plan = subscription.metadata?.plan || 'free'
        const orderBump = subscription.metadata?.orderBump === 'true'

        if (!userId) {
          console.warn(`[Webhook] Nenhum userId encontrado nos metadados da assinatura ${subscriptionId}`)
          break
        }

        // Determinar créditos base do plano
        let baseCredits = 0
        if (plan === 'starter') baseCredits = 30
        else if (plan === 'pro') baseCredits = 80
        else if (plan === 'agency') baseCredits = 200

        let creditsToAdd = 0
        let reason = 'subscription_renewal'

        if (invoice.billing_reason === 'subscription_create') {
          creditsToAdd = baseCredits + (orderBump ? 20 : 0)
          reason = 'plan_upgrade'
        } else if (invoice.billing_reason === 'subscription_cycle') {
          creditsToAdd = baseCredits
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
            plan: plan,
            credits: currentCredits + creditsToAdd
          }).eq('id', userId)

          console.log(`[Webhook] Processado pagamento para o usuário ${userId}. Plano: ${plan}. Créditos adicionados: ${creditsToAdd}`)
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
