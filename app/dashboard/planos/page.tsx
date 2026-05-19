'use client'

import { useState, useEffect, Suspense } from 'react'
import { Check, Loader2, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import CheckoutModal from '@/components/CheckoutModal'

const plans = [
  {
    name: 'Starter',
    price: '29',
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
    price: '59',
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
    price: '119',
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
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-[family-name:var(--font-bricolage)] font-extrabold text-white">R$ {plan.price}</span>
                <span className="text-[var(--text-muted)] text-sm">/mês</span>
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

      {selectedPlan && (
        <CheckoutModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          planKey={selectedPlan.name.toLowerCase() === 'agência' ? 'agency' : selectedPlan.name.toLowerCase()}
          planName={selectedPlan.name}
          price={selectedPlan.price}
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

