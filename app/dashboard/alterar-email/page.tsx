'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Mail, CheckCircle2, AlertCircle, Info } from 'lucide-react'

export default function AlterarEmailPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleUpdateEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um e-mail válido.')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ email })
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Ocorreu um erro ao solicitar a alteração de e-mail. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto py-12 px-4">
      {/* Glow Effects */}
      <div className="hero-glow" style={{ top: '10%', left: '30%', opacity: 0.3 }}></div>

      <div className="relative z-10 text-center mb-8">
        <div className="inline-flex p-3 rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 mb-4">
          <Mail className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-2">
          Alterar E-mail
        </h1>
        <p className="text-[var(--text-muted)] text-sm">
          Altere seu endereço de e-mail de acesso e cobrança na plataforma.
        </p>
      </div>

      <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-xl relative z-10">
        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-white">Solicitação enviada!</h3>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-sm mx-auto">
              Para sua total segurança, enviamos e-mails de confirmação. 
              <strong> Você precisará clicar no link enviado para o seu e-mail atual E para o seu novo e-mail</strong> para validar a alteração.
            </p>
            <button 
              onClick={() => {
                setSuccess(false)
                setEmail('')
              }}
              className="mt-4 text-xs font-semibold px-4 py-2 rounded-xl bg-[#ffffff0a] text-white border border-[var(--border-dark)] hover:bg-[#ffffff14] transition-colors"
            >
              Fazer nova solicitação
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdateEmail} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Security Information Box */}
            <div className="bg-blue-500/5 border border-blue-500/15 text-blue-400/90 p-4 rounded-xl text-xs space-y-2 leading-relaxed">
              <div className="flex items-center gap-2 font-semibold text-white mb-1 text-sm">
                <Info className="w-4.5 h-4.5 text-[var(--accent)] shrink-0" />
                <span>Medida de Segurança Ativa</span>
              </div>
              <p>
                O Supabase exige a confirmação nos dois endereços (no atual e no novo). 
                A alteração só será consolidada após ambos os links serem clicados.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-muted)]">Novo E-mail</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white placeholder:text-[var(--text-muted2)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all text-sm"
                placeholder="novo.email@exemplo.com"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 flex justify-center py-3.5 rounded-xl font-semibold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--accent)] text-white hover:brightness-110 transition-all shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Solicitando alteração...' : 'Confirmar e Alterar E-mail'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
