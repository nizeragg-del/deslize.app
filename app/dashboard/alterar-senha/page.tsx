'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AlterarSenhaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
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
      const { error } = await supabase.auth.updateUser({ password })
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      }
    } catch (err) {
      setError('Ocorreu um erro ao atualizar sua senha. Tente novamente.')
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
          <KeyRound className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-2">
          Alterar Senha
        </h1>
        <p className="text-[var(--text-muted)] text-sm">
          Escolha uma senha forte para manter sua conta do Deslize segura.
        </p>
      </div>

      <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-xl relative z-10">
        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-white">Senha alterada com sucesso!</h3>
            <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto">
              Sua senha foi redefinida. Você está sendo redirecionado para o dashboard em instantes...
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-muted)]">Nova Senha</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl pl-4 pr-11 py-3 text-white placeholder:text-[var(--text-muted2)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-muted)]">Confirmar Nova Senha</label>
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white placeholder:text-[var(--text-muted2)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all text-sm"
                placeholder="Repita a nova senha"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 flex justify-center py-3.5 rounded-xl font-semibold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--accent)] text-white hover:brightness-110 transition-all shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando nova senha...' : 'Atualizar Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
