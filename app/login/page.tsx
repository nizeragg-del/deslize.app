'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login, signup, signInWithGoogle } from './actions'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      const result = isLogin ? await login(formData) : await signup(formData)
      if (result?.error) {
        setError(result.error)
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="hero-glow" style={{ top: '-20%', left: '-10%', opacity: 0.5 }}></div>
      <div className="hero-glow-cyan" style={{ bottom: '-20%', right: '-10%', opacity: 0.5 }}></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="logo-icon scale-75">
              <span></span><span></span><span></span>
            </div>
            <span className="logo-text text-xl">deslize</span>
          </Link>
          <h1 className="text-3xl font-[family-name:var(--font-bricolage)] font-bold mb-2">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h1>
          <p className="text-[var(--text-muted2)]">
            {isLogin 
              ? 'Entre para gerar mais carrosséis incríveis.' 
              : 'Seu primeiro carrossel gerado por IA é por nossa conta.'}
          </p>
        </div>

        <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6 sm:p-8 shadow-xl">
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
            {isLogin ? 'Entrar com Google' : 'Criar conta com Google'}
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-[var(--border-dark)] flex-1"></div>
            <span className="text-xs text-[var(--text-muted2)] uppercase tracking-wider font-semibold">Ou com e-mail</span>
            <div className="h-px bg-[var(--border-dark)] flex-1"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                {error}
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
            
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Senha</label>
              <input 
                name="password"
                type="password" 
                required
                className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white placeholder:text-[var(--text-muted2)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary mt-2 flex justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar conta')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
            {isLogin ? 'Ainda não tem uma conta?' : 'Já tem uma conta?'}{' '}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-[var(--accent)] hover:text-white transition-colors"
            >
              {isLogin ? 'Criar grátis' : 'Fazer login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
