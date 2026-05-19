import { NextResponse } from 'next/server'
import { stripe } from '@/utils/stripe/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let { priceId, planKey, hasOrderBump } = await req.json()

    if (!priceId && planKey) {
      const envKey = `STRIPE_PRICE_${planKey.toUpperCase()}`
      priceId = process.env[envKey]
    }

    if (!priceId) {
      return NextResponse.json({ error: 'Plano inválido ou ID de preço ausente' }, { status: 400 })
    }

    // 1. Obter ou criar o customer no Stripe
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.name || user.email,
        metadata: {
          userId: user.id
        }
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // 2. Se o usuário ativou o Order Bump, criamos um item avulso na fatura inicial
    if (hasOrderBump) {
      const orderBumpPriceId = process.env.STRIPE_PRICE_ORDER_BUMP
      if (!orderBumpPriceId) {
        console.error('STRIPE_PRICE_ORDER_BUMP não configurado no .env')
      } else {
        await stripe.invoiceItems.create({
          customer: customerId,
          price: orderBumpPriceId,
          description: 'Order Bump: +20 Créditos Adicionais',
        })
      }
    }

    // 3. Criar a assinatura como 'default_incomplete'
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: user.id,
        plan: planKey || 'starter',
        orderBump: hasOrderBump ? 'true' : 'false'
      }
    })

    const invoice = subscription.latest_invoice as any
    const paymentIntent = invoice.payment_intent

    if (!paymentIntent) {
      return NextResponse.json({ error: 'Erro ao gerar intenção de pagamento' }, { status: 500 })
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      customerId
    })

  } catch (error: any) {
    console.error('Error creating subscription checkout:', error)
    return NextResponse.json({ error: error.message || 'Erro ao criar sessão de pagamento' }, { status: 500 })
  }
}
