'use client'

import { useState, useEffect, FormEvent } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Loader2, X, ShieldCheck, Flame, CreditCard } from 'lucide-react'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  planKey: 'starter' | 'pro' | 'agency'
  planName: string
  price: string
  credits: number
}

export default function CheckoutModal({
  isOpen,
  onClose,
  planKey,
  planName,
  price,
  credits
}: CheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [hasOrderBump, setHasOrderBump] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch client secret when modal opens or order bump state changes
  useEffect(() => {
    if (!isOpen) return

    async function initCheckout() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planKey,
            hasOrderBump
          })
        })
        const data = await res.json()
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          setError(data.error || 'Erro ao carregar checkout')
          console.error(data.error || 'Erro ao carregar checkout')
        }
      } catch (err: any) {
        setError(err.message || 'Erro de rede ao carregar checkout')
        console.error('Erro de rede ao carregar checkout:', err)
      } finally {
        setLoading(false)
      }
    }

    initCheckout()
  }, [isOpen, planKey, hasOrderBump])

  if (!isOpen) return null

  const basePriceNum = parseInt(price)
  const totalPrice = hasOrderBump ? basePriceNum + 15 : basePriceNum

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#7C3AED',
      colorBackground: '#0f111a',
      colorText: '#F4F4F8',
      colorTextPlaceholder: '#5A5A72',
      colorDanger: '#EF4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '12px'
    },
    rules: {
      '.Input': {
        border: '1px solid #1f2233',
        boxShadow: 'none'
      },
      '.Input:focus': {
        border: '1px solid #7C3AED',
        boxShadow: '0 0 0 1px #7C3AED'
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-[#07070D] border border-[var(--border-dark)] rounded-3xl w-full max-w-lg overflow-hidden relative shadow-[0_0_50px_-12px_rgba(124,58,237,0.3)] animate-in fade-in zoom-in duration-300 flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-dark)]">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[var(--brand-primary)]" />
              Checkout Seguro
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Finalize sua assinatura do plano {planName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
          {/* Order Summary */}
          <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] p-5 rounded-2xl">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Resumo do Pedido
            </h4>
            <div className="flex justify-between items-center text-sm mb-2 text-white">
              <span>Assinatura {planName} ({credits} créditos/mês)</span>
              <span className="font-bold">R$ {price},00/mês</span>
            </div>
            {hasOrderBump && (
              <div className="flex justify-between items-center text-sm text-[var(--accent)] font-medium mb-2 animate-in slide-in-from-top-2 duration-200">
                <span>🔥 Adicional: +20 créditos extras</span>
                <span className="font-bold">R$ 15,00 (Único)</span>
              </div>
            )}
            <hr className="border-[var(--border-dark)] my-3" />
            <div className="flex justify-between items-center text-base font-bold text-white">
              <span>Total hoje</span>
              <span className="text-xl text-[var(--brand-primary)]">R$ {totalPrice},00</span>
            </div>
          </div>

          {/* Order Bump Box */}
          <div 
            onClick={() => setHasOrderBump(!hasOrderBump)}
            className={`border rounded-2xl p-4 cursor-pointer transition-all flex items-start gap-4 select-none ${
              hasOrderBump 
                ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)] shadow-[0_0_15px_-5px_rgba(124,58,237,0.3)]' 
                : 'bg-transparent border-dashed border-[var(--border-dark)] hover:border-white/20'
            }`}
          >
            <input 
              type="checkbox" 
              checked={hasOrderBump}
              onChange={() => {}} // handled by click on container
              className="mt-1 accent-[var(--brand-primary)] rounded h-4 w-4 shrink-0"
            />
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5 bg-[var(--brand-primary)]/20 px-2.5 py-0.5 rounded-full w-fit mb-2">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" /> OFERTA EXCLUSIVA
              </span>
              <h5 className="text-sm font-bold text-white">
                Adicionar +20 créditos extras por R$ 15
              </h5>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                Quer acelerar ainda mais? Adicione 20 créditos permanentes e avulsos à sua conta agora mesmo. <strong>Pago uma única vez!</strong>
              </p>
            </div>
          </div>

          {/* Stripe Form */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
              <p className="text-sm text-[var(--text-muted)]">Carregando formulário seguro...</p>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
              <StripeForm 
                totalPrice={totalPrice}
                submitting={submitting}
                setSubmitting={setSubmitting}
              />
            </Elements>
          ) : (
            <div className="text-center py-8 text-red-500 text-sm font-medium">
              <p>Não foi possível inicializar o checkout:</p>
              <p className="text-xs text-red-400 mt-2 bg-red-500/10 p-3 rounded-xl border border-red-500/20 max-w-md mx-auto break-words font-mono">
                {error || 'Erro desconhecido'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[var(--surface-dark)]/40 border-t border-[var(--border-dark)] flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Pagamentos processados e criptografados de forma segura via Stripe.
        </div>
      </div>
    </div>
  )
}

interface StripeFormProps {
  totalPrice: number
  submitting: boolean
  setSubmitting: (state: boolean) => void
}

function StripeForm({ totalPrice, submitting, setSubmitting }: StripeFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setSubmitting(true)
    setErrorMessage(null)

    // Trigger form validation and wallet collection
    const { error: submitError } = await elements.submit()
    if (submitError) {
      setErrorMessage(submitError.message || 'Erro de validação')
      setSubmitting(false)
      return
    }

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?checkout_success=true`
        }
      })

      if (error) {
        setErrorMessage(error.message || 'Ocorreu um erro no pagamento.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha de conexão com a Stripe.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs leading-relaxed animate-in fade-in duration-200">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-dark)] text-white hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(124,58,237,0.3)] cursor-pointer"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Confirmando Pagamento...</>
        ) : (
          `Pagar R$ ${totalPrice},00`
        )}
      </button>
    </form>
  )
}
