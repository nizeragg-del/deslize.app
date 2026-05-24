'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react'

export default function AlterarSenhaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleUpdatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      setLoading(false)
      return
    }

    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 3000)
    } catch {
      setError('Ocorreu um erro ao atualizar sua senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12">
      <div className="relative z-10 mb-8 text-center">
        <div className="mb-4 inline-flex rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/10 p-3 text-[var(--brand-primary)]">
          <KeyRound className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-white">Alterar Senha</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Escolha uma senha forte para manter sua conta do Deslize segura.
        </p>
      </div>

      <div className="relative z-10 rounded-2xl border border-[var(--border-dark)] bg-[var(--surface-dark)] p-6 shadow-xl backdrop-blur-xl sm:p-8">
        {success ? (
          <div className="space-y-4 py-6 text-center">
            <div className="mb-2 inline-flex animate-bounce rounded-full border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-400">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold text-white">Senha alterada com sucesso!</h3>
            <p className="mx-auto max-w-sm text-sm text-[var(--text-muted)]">
              Sua senha foi redefinida. Você está sendo redirecionado para o dashboard em instantes...
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <label className="block space-y-1.5">
              <span className="block text-sm font-medium text-[var(--text-muted)]">Nova Senha</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-[var(--border-dark)] bg-[#00000033] py-3 pl-4 pr-11 text-sm text-white transition-all placeholder:text-[var(--text-muted2)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="block text-sm font-medium text-[var(--text-muted)]">Confirmar Nova Senha</span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-[var(--border-dark)] bg-[#00000033] px-4 py-3 text-sm text-white transition-all placeholder:text-[var(--text-muted2)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                placeholder="Repita a nova senha"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full justify-center rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--accent)] py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Salvando nova senha...' : 'Atualizar Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
