'use client'

import { Suspense, useEffect, useState } from 'react'
import { Check, CreditCard, Loader2, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import CheckoutModal from '@/components/CheckoutModal'

const plans = [
  {
    name: 'Starter',
    key: 'starter',
    monthly: '29',
    annual: '24',
    credits: 30,
    features: ['30 carrosséis por mês', '1 Brand Kit', 'Exportação PNG HD', 'Projetos no Studio'],
  },
  {
    name: 'Pro',
    key: 'pro',
    monthly: '59',
    annual: '49',
    credits: 80,
    popular: true,
    features: ['80 carrosséis por mês', '3 Brand Kits', 'Histórico ilimitado', 'Suporte prioritário'],
  },
  {
    name: 'Agência',
    key: 'agency',
    monthly: '119',
    annual: '99',
    credits: 200,
    features: ['200 carrosséis por mês', '10 Brand Kits', 'Exportação 4K', 'Suporte WhatsApp'],
  },
]

function PlansContent() {
  const searchParams = useSearchParams()
  const [billing, setBilling] = useState<'mensal' | 'anual'>('mensal')
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [portalError, setPortalError] = useState('')

  useEffect(() => {
    const planParam = searchParams.get('plan')
    if (!planParam) return
    const match = plans.find((plan) => plan.key === planParam || plan.name.toLowerCase() === planParam.toLowerCase())
    if (match) setSelectedPlan(match)
  }, [searchParams])

  async function openPortal() {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setPortalError('Nenhuma assinatura ativa encontrada.')
    } catch {
      setPortalError('Erro de conexão ao acessar o portal.')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-cyan-300">Planos</p>
          <h1 className="mt-2 text-4xl font-bold">Escolha seu ritmo de criação</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">Mais créditos, mais Brand Kits e exportações prontas para publicar.</p>
        </div>
        <button onClick={openPortal} className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-bold text-white/80 hover:bg-white/10">
          <CreditCard className="h-4 w-4" />
          Gerenciar assinatura
        </button>
      </div>

      {portalError && (
        <div className="rounded-2xl border border-yellow-300/20 bg-yellow-400/[0.10] px-5 py-4 text-sm font-semibold text-yellow-100">
          {portalError}
        </div>
      )}

      <div className="inline-flex rounded-full border border-white/10 bg-[#191a1d] p-1">
        <button onClick={() => setBilling('mensal')} className={`rounded-full px-5 py-2 text-sm font-bold ${billing === 'mensal' ? 'bg-[#2f3135] text-white' : 'text-white/50'}`}>
          Mensal
        </button>
        <button onClick={() => setBilling('anual')} className={`rounded-full px-5 py-2 text-sm font-bold ${billing === 'anual' ? 'bg-[#2f3135] text-white' : 'text-white/50'}`}>
          Anual
        </button>
      </div>

      <section className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = billing === 'anual' ? plan.annual : plan.monthly
          return (
            <article key={plan.key} className={`relative rounded-3xl border bg-[#191a1d] p-6 ${plan.popular ? 'border-purple-400/50 shadow-[0_0_70px_rgba(168,85,247,0.18)]' : 'border-white/10'}`}>
              {plan.popular && (
                <span className="absolute right-5 top-5 rounded-full bg-purple-500 px-3 py-1 text-xs font-bold">
                  Popular
                </span>
              )}
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-bold">R$ {price}</span>
                <span className="pb-2 text-sm text-white/45">/mês</span>
              </div>
              {billing === 'anual' && <p className="mt-2 text-sm font-semibold text-emerald-300">Cobrado anualmente com desconto.</p>}
              <p className="mt-4 text-sm font-semibold text-cyan-300">{plan.credits} créditos mensais</p>

              <div className="my-6 h-px bg-white/10" />

              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <p key={feature} className="flex items-center gap-3 text-sm text-white/70">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                      <Check className="h-3 w-3" />
                    </span>
                    {feature}
                  </p>
                ))}
              </div>

              <button onClick={() => setSelectedPlan(plan)} className={`mt-8 w-full rounded-full px-5 py-4 text-sm font-bold ${plan.popular ? 'bg-purple-500 text-white' : 'bg-white text-black'}`}>
                Assinar {plan.name}
              </button>
            </article>
          )
        })}
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#191a1d] p-6">
        <h2 className="text-xl font-bold">Garantia de 7 dias</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">
          Teste a criação de carrosséis com IA. Se a ferramenta não economizar tempo no seu processo de conteúdo, você pode cancelar sem burocracia.
        </p>
      </section>

      {selectedPlan && (
        <CheckoutModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          planKey={(billing === 'anual' ? `${selectedPlan.key}_annual` : selectedPlan.key) as 'starter' | 'pro' | 'agency' | 'starter_annual' | 'pro_annual' | 'agency_annual'}
          planName={`${selectedPlan.name} (${billing === 'anual' ? 'Anual' : 'Mensal'})`}
          price={billing === 'anual' ? (parseInt(selectedPlan.annual) * 12).toString() : selectedPlan.monthly}
          credits={selectedPlan.credits}
        />
      )}
    </div>
  )
}

export default function PlansPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-300" /></div>}>
      <PlansContent />
    </Suspense>
  )
}
