'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login, signup, signInWithGoogle, resetPasswordEmail } from './actions'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      if (mode === 'login') {
        const result = await login(formData)
        if (result?.error) {
          setError(result.error)
        }
      } else if (mode === 'signup') {
        const result = await signup(formData)
        if (result?.error) {
          setError(result.error)
        }
      } else if (mode === 'forgot') {
        const result = await resetPasswordEmail(formData)
        if (result?.error) {
          setError(result.error)
        } else {
          setSuccessMessage('E-mail de redefinição enviado com sucesso! Verifique sua caixa de entrada e spam.')
        }
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      const result = await signInWithGoogle()
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
    } catch (err) {
      setError('Ocorreu um erro ao conectar com o Google.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[var(--bg-dark)] font-[family-name:var(--font-manrope)]">
      {/* Background glow effects */}
      <div className="hero-glow" style={{ top: '-20%', left: '-10%', opacity: 0.5 }}></div>
      <div className="hero-glow-cyan" style={{ bottom: '-20%', right: '-10%', opacity: 0.5 }}></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="logo mb-6 inline-flex items-center justify-center">
            <div className="logo-icon">
              <span></span><span></span><span></span>
            </div>
            <span className="logo-text text-xl">deslize</span>
          </Link>
          
          <h1 className="text-3xl font-[family-name:var(--font-bricolage)] font-bold mb-2 text-white">
            {mode === 'login' && 'Bem-vindo de volta'}
            {mode === 'signup' && 'Crie sua conta'}
            {mode === 'forgot' && 'Recuperar senha'}
          </h1>
          <p className="text-[var(--text-muted2)]">
            {mode === 'login' && 'Entre para gerar mais carrosséis incríveis.'}
            {mode === 'signup' && 'Seu primeiro carrossel gerado por IA é por nossa conta.'}
            {mode === 'forgot' && 'Digite seu e-mail para receber as instruções de recuperação.'}
          </p>
        </div>

        <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-xl">
          {mode !== 'forgot' && (
            <>
              <button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-[#ffffff0a] hover:bg-[#ffffff14] border border-[var(--border-dark)] text-white py-3 px-4 rounded-xl font-medium transition-colors mb-6 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {mode === 'login' ? 'Entrar com Google' : 'Criar conta com Google'}
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-[var(--border-dark)] flex-1"></div>
                <span className="text-xs text-[var(--text-muted2)] uppercase tracking-wider font-semibold">Ou com e-mail</span>
                <div className="h-px bg-[var(--border-dark)] flex-1"></div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">E-mail</label>
              <input 
                name="email"
                type="email" 
                required
                className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white placeholder:text-[var(--text-muted2)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
                placeholder="seu@email.com"
              />
            </div>
            
            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-[var(--text-muted)]">Senha</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot')
                        setError(null)
                        setSuccessMessage(null)
                      }}
                      className="text-xs text-[var(--accent)] hover:text-white transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <input 
                  name="password"
                  type="password" 
                  required
                  className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white placeholder:text-[var(--text-muted2)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary mt-2 flex justify-center disabled:opacity-70 disabled:cursor-not-allowed py-3 rounded-xl font-semibold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--accent)] text-white hover:brightness-110 transition-all shadow-lg"
            >
              {loading ? 'Processando...' : (
                mode === 'login' ? 'Entrar' : 
                mode === 'signup' ? 'Criar conta' : 
                'Enviar instruções'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
            {mode === 'login' && (
              <>
                Ainda não tem uma conta?{' '}
                <button 
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                    setSuccessMessage(null)
                  }} 
                  className="text-[var(--accent)] hover:text-white transition-colors font-medium"
                >
                  Criar grátis
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Já tem uma conta?{' '}
                <button 
                  onClick={() => {
                    setMode('login')
                    setError(null)
                    setSuccessMessage(null)
                  }} 
                  className="text-[var(--accent)] hover:text-white transition-colors font-medium"
                >
                  Fazer login
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <button 
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setSuccessMessage(null)
                }} 
                className="text-[var(--accent)] hover:text-white transition-colors font-medium"
              >
                Voltar para o login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
