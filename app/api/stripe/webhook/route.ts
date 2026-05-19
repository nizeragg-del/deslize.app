import { NextResponse } from 'next/server'
import { stripe } from '@/utils/stripe/server'
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

        if (priceId === process.env.STRIPE_PRICE_STARTER) {
          creditsToAdd = 30
          newPlan = 'starter'
        } else if (priceId === process.env.STRIPE_PRICE_PRO) {
          creditsToAdd = 80
          newPlan = 'pro'
        } else if (priceId === process.env.STRIPE_PRICE_AGENCY) {
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
        // Handle subscription renewal
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription
        const customerId = invoice.customer

        if (invoice.billing_reason === 'subscription_cycle') {
          // Find user by customerId
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, credits')
            .eq('stripe_customer_id', customerId)
            .single()

          if (profile) {
            // Get subscription line item to know how many credits
            const lineItems = invoice.lines.data
            const priceId = lineItems[0]?.price?.id

            let creditsToAdd = 0
            if (priceId === process.env.STRIPE_PRICE_STARTER) creditsToAdd = 30
            if (priceId === process.env.STRIPE_PRICE_PRO) creditsToAdd = 80
            if (priceId === process.env.STRIPE_PRICE_AGENCY) creditsToAdd = 200

            if (creditsToAdd > 0) {
              await supabaseAdmin.from('credit_transactions').insert({
                user_id: profile.id,
                amount: creditsToAdd,
                reason: 'subscription_renewal',
                stripe_session_id: invoice.id
              })

              const currentCredits = profile.credits || 0
              
              await supabaseAdmin.from('profiles').update({
                credits: currentCredits + creditsToAdd
              }).eq('id', profile.id)
            }
          }
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
