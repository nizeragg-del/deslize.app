'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Image as ImageIcon, Sparkles, Clock, Calendar } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function DashboardHome() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ credits: number; plan: string } | null>(null)
  const [carousels, setCarousels] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboardData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Fetch profile
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('credits, plan')
        .eq('id', user.id)
        .single()

      if (profileError || !profileData) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Criador',
            avatar_url: user.user_metadata?.avatar_url,
            plan: 'free',
            credits: 1
          })
          .select('credits, plan')
          .single()

        if (newProfile) {
          profileData = newProfile
        }
      }

      if (profileData) {
        setProfile(profileData)
      }

      // 2. Fetch carousels
      const { data: carouselsData } = await supabase
        .from('carousels')
        .select('id, title, status, created_at, format, slide_count')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (carouselsData) {
        setCarousels(carouselsData.slice(0, 6)) // Show up to 6 recent carousels
        setTotalCount(carouselsData.length)
      }
      setLoading(false)
    }

    loadDashboardData()
  }, [])

  const maxCredits = profile?.plan === 'free' ? 1 : profile?.plan === 'starter' ? 30 : profile?.plan === 'pro' ? 80 : 200

  // Helper to format date
  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--accent)]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-1">
            Olá, <span className="text-gradient">Criador</span>
          </h1>
          <p className="text-[var(--text-muted)]">Pronto para gerar seu próximo carrossel viral?</p>
        </div>
        <Link 
          href="/dashboard/novo" 
          className="btn-primary inline-flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Novo Carrossel
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] p-5 rounded-2xl">
          <div className="flex items-center gap-3 text-[var(--text-muted)] mb-3">
            <Sparkles className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="font-medium text-sm">Créditos Disponíveis</h3>
          </div>
          <p className="text-3xl font-[family-name:var(--font-bricolage)] font-bold text-white">
            {profile ? profile.credits : 0}{' '}
            <span className="text-base font-normal text-[var(--text-muted)]">/ {maxCredits}</span>
          </p>
        </div>
        
        <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] p-5 rounded-2xl">
          <div className="flex items-center gap-3 text-[var(--text-muted)] mb-3">
            <ImageIcon className="w-5 h-5 text-[var(--brand-primary)]" />
            <h3 className="font-medium text-sm">Carrosséis Gerados</h3>
          </div>
          <p className="text-3xl font-[family-name:var(--font-bricolage)] font-bold text-white">{totalCount}</p>
        </div>

        <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] p-5 rounded-2xl">
          <div className="flex items-center gap-3 text-[var(--text-muted)] mb-3">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h3 className="font-medium text-sm">Status do Plano</h3>
          </div>
          <p className="text-3xl font-[family-name:var(--font-bricolage)] font-bold text-white uppercase text-gradient">
            {profile?.plan === 'free' ? 'Grátis' : profile?.plan || 'Grátis'}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white">Seus Carrosséis</h2>
        </div>

        {carousels.length === 0 ? (
          <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-12 text-center">
            <ImageIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-white mb-2">Nenhum carrossel ainda</h3>
            <p className="text-[var(--text-muted)] mb-6 max-w-sm mx-auto">Você ainda não criou nenhum carrossel. Comece agora mesmo a gerar conteúdos incríveis!</p>
            <Link href="/dashboard/novo" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Criar meu primeiro carrossel
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carousels.map((carousel) => (
              <div 
                key={carousel.id} 
                className="group bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl overflow-hidden hover:border-[var(--brand-primary)]/50 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Thumbnail Placeholder */}
                <div className="aspect-[4/5] bg-gradient-to-br from-[#ffffff05] to-[#ffffff0a] relative flex items-center justify-center border-b border-[var(--border-dark)] overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise-pattern-with-subtle-cross-lines.png')] opacity-20"></div>
                  
                  {/* Simulated Carousel Stack */}
                  <div className="relative w-2/3 aspect-square">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-dark)] rounded-xl transform rotate-6 scale-90 opacity-40 group-hover:rotate-12 transition-transform duration-500"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--accent)] rounded-xl transform rotate-3 scale-95 opacity-70 group-hover:rotate-6 transition-transform duration-500"></div>
                    <div className="absolute inset-0 bg-[var(--bg-dark)] border border-[var(--border-dark)] rounded-xl flex items-center justify-center group-hover:-translate-y-1 group-hover:-translate-x-1 transition-transform duration-500 shadow-xl">
                      <span className="text-2xl opacity-50 font-[family-name:var(--font-bricolage)] font-bold">1/{carousel.slide_count}</span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400">
                        Pronto
                      </span>
                      <span className="text-xs text-[var(--text-muted2)]">{carousel.format}</span>
                    </div>
                    <h3 className="font-bold text-white mb-1 group-hover:text-[var(--accent)] transition-colors truncate">
                      {carousel.title}
                    </h3>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[var(--border-dark)] pt-3">
                    <span className="text-xs text-[var(--text-muted)] inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(carousel.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
