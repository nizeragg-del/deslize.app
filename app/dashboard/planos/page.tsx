'use client'

import { useState, useEffect, Suspense } from 'react'
import { Check, Loader2, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import CheckoutModal from '@/components/CheckoutModal'

const plans = [
  {
    name: 'Starter',
    priceMonthly: '29',
    priceAnnual: '24',
    credits: 30,
    features: [
      '30 carrosséis por mês',
      '1 marca salva',
      'Exportação em PNG (HD)',
      'Histórico de 30 dias',
      'Suporte por e-mail'
    ],
    popular: false
  },
  {
    name: 'Pro',
    priceMonthly: '59',
    priceAnnual: '49',
    credits: 80,
    features: [
      '80 carrosséis por mês',
      '3 marcas salvas',
      'Exportação em PNG (HD)',
      'Histórico ilimitado',
      'Suporte prioritário'
    ],
    popular: true
  },
  {
    name: 'Agência',
    priceMonthly: '119',
    priceAnnual: '99',
    credits: 200,
    features: [
      '200 carrosséis por mês',
      '10 marcas salvas',
      'Exportação em PNG (4K)',
      'Histórico ilimitado',
      'Suporte prioritário (WhatsApp)'
    ],
    popular: false
  }
]

function PlansContent() {
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [billingCycle, setBillingCycle] = useState<'mensal' | 'anual'>('anual')
  const searchParams = useSearchParams()
  const planParam = searchParams?.get('plan')

  useEffect(() => {
    if (planParam) {
      const match = plans.find(p => 
        p.name.toLowerCase() === planParam.toLowerCase() || 
        (planParam.toLowerCase() === 'agency' && p.name.toLowerCase() === 'agência')
      )
      if (match) {
        setSelectedPlan(match)
      }
    }
  }, [planParam])

  const handleSubscribe = (plan: any) => {
    setSelectedPlan(plan)
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col py-8 animate-in fade-in duration-500">
      
      <div className="text-center mb-12 relative">
        <h1 className="text-3xl md:text-4xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-4">
          Acelere sua produção de conteúdo
        </h1>
        <p className="text-[var(--text-muted)] max-w-2xl mx-auto mb-6">
          Escolha o plano ideal para a sua necessidade e libere todo o potencial da inteligência artificial para criar carrosséis magnéticos em segundos.
        </p>

        <button 
          onClick={async () => {
            try {
              const res = await fetch('/api/stripe/portal', { method: 'POST' })
              const data = await res.json()
              if (data.url) window.location.href = data.url
              else alert('Nenhuma assinatura ativa encontrada.')
            } catch (err) {
              alert('Erro de conexão ao acessar o portal.')
            }
          }}
          className="text-sm font-medium text-[var(--text-muted)] hover:text-white underline underline-offset-4 transition-colors"
        >
          Gerenciar minha assinatura atual
        </button>
      </div>

      <div className="flex justify-center items-center mb-10">
        <div className="bg-[#00000033] p-1 rounded-xl border border-[var(--border-dark)] inline-flex items-center">
          <button
            onClick={() => setBillingCycle('mensal')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              billingCycle === 'mensal'
                ? 'bg-[var(--surface-dark)] text-white shadow-md border border-[var(--border-dark)]'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle('anual')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              billingCycle === 'anual'
                ? 'bg-[var(--surface-dark)] text-white shadow-md border border-[var(--border-dark)]'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            Anual <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Desconto OFF</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
        {plans.map(plan => (
          <div 
            key={plan.name}
            className={`relative flex flex-col p-8 rounded-3xl border transition-all ${
              plan.popular 
                ? 'bg-[var(--surface-dark)] border-[var(--brand-primary)] shadow-[0_0_40px_-15px_rgba(124,58,237,0.4)] scale-105 z-10' 
                : 'bg-[#050508] border-[var(--border-dark)] hover:border-white/20'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <span className="bg-[var(--brand-primary)] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Mais Popular
                </span>
              </div>
            )}
            
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-[family-name:var(--font-bricolage)] font-extrabold text-white">
                  R$ {billingCycle === 'anual' ? plan.priceAnnual : plan.priceMonthly}
                </span>
                <span className="text-[var(--text-muted)] text-sm">/mês</span>
                {billingCycle === 'anual' && (
                  <span className="text-sm text-[var(--text-muted)] line-through opacity-50">R$ {plan.priceMonthly}</span>
                )}
              </div>
              <div className="min-h-[20px] mt-1.5 flex flex-wrap items-center gap-2">
                {billingCycle === 'anual' && (
                  <>
                    <span className="text-[10px] text-[var(--text-muted2)]">
                      Cobrado R$ {parseInt(plan.priceAnnual) * 12} anualmente
                    </span>
                    <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                      💰 Economize R$ {(parseInt(plan.priceMonthly) - parseInt(plan.priceAnnual)) * 12}/ano
                    </span>
                  </>
                )}
              </div>
              <p className="text-[var(--accent)] text-sm mt-2 font-medium">{plan.credits} créditos mensais</p>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              {plan.features.map(feature => (
                <div key={feature} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-[var(--brand-primary)]/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-[var(--brand-primary)]" />
                  </div>
                  <span className="text-[var(--text-muted)] text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSubscribe(plan)}
              className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                plan.popular 
                  ? 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)]/90' 
                  : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              Assinar {plan.name}
            </button>
          </div>
        ))}
      </div>

      {/* Gold Guarantee Seal & FAQ */}
      <div className="max-w-3xl mx-auto mt-20 text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center p-0.5 mb-6 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
          <div className="w-full h-full bg-[#050508] rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-yellow-500 fill-yellow-500 animate-pulse" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">Garantia Incondicional de 7 Dias</h3>
        <p className="text-[var(--text-muted)] text-sm mb-12">
          Se você não gostar dos carrosséis gerados pela IA ou achar que a ferramenta não economizou horas do seu dia, devolvemos 100% do seu dinheiro. Sem perguntas.
        </p>

        <div className="text-left space-y-4">
          <details className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-5 group cursor-pointer">
            <summary className="font-bold text-white list-none flex justify-between items-center">
              Posso cancelar a qualquer momento?
              <span className="transition group-open:rotate-180">▼</span>
            </summary>
            <p className="text-[var(--text-muted)] text-sm mt-4 leading-relaxed">
              Sim! Nossa assinatura não possui fidelidade. Você pode cancelar a renovação automática a qualquer momento com apenas 2 cliques no seu painel.
            </p>
          </details>
          <details className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-5 group cursor-pointer">
            <summary className="font-bold text-white list-none flex justify-between items-center">
              Como funcionam os créditos?
              <span className="transition group-open:rotate-180">▼</span>
            </summary>
            <p className="text-[var(--text-muted)] text-sm mt-4 leading-relaxed">
              Cada carrossel gerado consome 1 crédito. Se você não usar todos os créditos no mês, eles expiram e o ciclo se renova. Planos maiores possuem limite de créditos muito superior.
            </p>
          </details>
        </div>
      </div>

      {selectedPlan && (
        <CheckoutModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          planKey={(() => {
            const base = selectedPlan.name.toLowerCase() === 'agência' ? 'agency' : selectedPlan.name.toLowerCase()
            if (billingCycle === 'anual') return `${base}_annual` as 'starter_annual' | 'pro_annual' | 'agency_annual'
            return base as 'starter' | 'pro' | 'agency'
          })()}
          planName={`${selectedPlan.name} (${billingCycle === 'anual' ? 'Anual' : 'Mensal'})`}
          price={billingCycle === 'anual' ? (parseInt(selectedPlan.priceAnnual)*12).toString() : selectedPlan.priceMonthly}
          credits={selectedPlan.credits}
        />
      )}
    </div>
  )
}

export default function PlansPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
      </div>
    }>
      <PlansContent />
    </Suspense>
  )
}

