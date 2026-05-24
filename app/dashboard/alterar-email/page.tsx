'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Info, Mail } from 'lucide-react'

export default function AlterarEmailPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleUpdateEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um e-mail válido.')
      setLoading(false)
      return
    }

    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ email })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
    } catch {
      setError('Ocorreu um erro ao solicitar a alteração de e-mail. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12">
      <div className="relative z-10 mb-8 text-center">
        <div className="mb-4 inline-flex rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/10 p-3 text-[var(--brand-primary)]">
          <Mail className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-white">Alterar E-mail</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Altere seu endereço de e-mail de acesso e cobrança na plataforma.
        </p>
      </div>

      <div className="relative z-10 rounded-2xl border border-[var(--border-dark)] bg-[var(--surface-dark)] p-6 shadow-xl backdrop-blur-xl sm:p-8">
        {success ? (
          <div className="space-y-4 py-6 text-center">
            <div className="mb-2 inline-flex animate-bounce rounded-full border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-400">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold text-white">Solicitação enviada!</h3>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
              Para sua segurança, enviamos e-mails de confirmação para o endereço atual e para o novo endereço.
            </p>
            <button
              type="button"
              onClick={() => {
                setSuccess(false)
                setEmail('')
              }}
              className="mt-4 rounded-xl border border-[var(--border-dark)] bg-[#ffffff0a] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#ffffff14]"
            >
              Fazer nova solicitação
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdateEmail} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2 rounded-xl border border-blue-500/15 bg-blue-500/5 p-4 text-xs leading-relaxed text-blue-400/90">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
                <Info className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                <span>Medida de Segurança Ativa</span>
              </div>
              <p>
                O Supabase exige confirmação nos dois endereços. A alteração só será concluída após ambos os links serem clicados.
              </p>
            </div>

            <label className="block space-y-1.5">
              <span className="block text-sm font-medium text-[var(--text-muted)]">Novo E-mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-[var(--border-dark)] bg-[#00000033] px-4 py-3 text-sm text-white transition-all placeholder:text-[var(--text-muted2)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                placeholder="novo.email@exemplo.com"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full justify-center rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--accent)] py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Solicitando alteração...' : 'Confirmar e Alterar E-mail'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
