'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Plus, History, Settings, Sparkles, Menu, X, LogOut, Mail, KeyRound, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [plan, setPlan] = useState<string>('free')
  const [name, setName] = useState<string>('Criador')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('credits, plan, name, avatar_url')
          .eq('id', user.id)
          .single()
        
        if (error || !profile) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'Criador',
              avatar_url: user.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/shapes/svg?seed=Aurora',
              plan: 'free',
              credits: 1
            })
            .select('credits, plan, name, avatar_url')
            .single()
          
          if (newProfile) {
            profile = newProfile
          }
        }

        if (profile) {
          setCredits(profile.credits)
          setPlan(profile.plan)
          setName(profile.name || user.email?.split('@')[0] || 'Criador')
          setAvatarUrl(profile.avatar_url || '')
        }
      }
    }
    fetchProfile()

    window.addEventListener('profile-updated', fetchProfile)
    return () => {
      window.removeEventListener('profile-updated', fetchProfile)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const maxCredits = plan === 'free' ? 1 : plan === 'starter' ? 30 : plan === 'pro' ? 80 : 200

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Novo Carrossel', href: '/dashboard/novo', icon: Plus },
    { name: 'Meus Carrosséis', href: '/dashboard/historico', icon: History },
    { name: 'Brand Kit', href: '/dashboard/marca', icon: Sparkles },
    { name: 'Planos e Faturamento', href: '/dashboard/planos', icon: Settings },
  ]

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[var(--surface-dark)] border-r border-[var(--border-dark)] p-4">
      <Link href="/dashboard" className="logo mb-8 px-2">
        <div className="logo-icon">
          <span></span><span></span><span></span>
        </div>
        <span className="logo-text text-xl">deslize</span>
      </Link>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                  : 'text-[var(--text-muted)] hover:bg-[#ffffff0a] hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Credits Badge */}
      <div className="mt-8 mb-4 p-4 rounded-xl bg-gradient-to-br from-[#ffffff0a] to-transparent border border-[var(--border-dark)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">Créditos</span>
          <span className="text-xs font-bold text-[var(--accent)]">
            {credits !== null ? `${credits}/${maxCredits}` : '...'}
          </span>
        </div>
        <div className="w-full h-2 bg-[#00000055] rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--accent)] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, ((credits ?? 0) / maxCredits) * 100))}%` }}
          ></div>
        </div>
        <Link href="/dashboard/planos" className="block text-center text-xs font-medium text-[var(--text-muted)] hover:text-white transition-colors">
          Fazer upgrade
        </Link>
      </div>

      {/* User Area */}
      <div className="pt-4 border-t border-[var(--border-dark)] space-y-1">
        {/* Interactive User profile badge in sidebar */}
        <Link 
          href="/dashboard/perfil"
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all border mb-2 group ${
            pathname === '/dashboard/perfil'
              ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/20 text-[var(--brand-primary)] font-semibold'
              : 'border-transparent text-[var(--text-muted)] hover:text-white hover:bg-[#ffffff0a]'
          }`}
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-[var(--border-dark)] bg-[#14151f] flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-[var(--text-muted)]" />
            )}
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs font-semibold truncate group-hover:text-white transition-colors">{name}</p>
            <p className="text-[10px] text-[var(--text-muted2)] truncate">Meu Perfil</p>
          </div>
        </Link>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-[var(--text-muted)] hover:text-white transition-colors rounded-lg hover:bg-[#ffffff0a] mt-1"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[var(--bg-dark)] overflow-hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-lg text-white"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar Desktop */}
      <aside className="hidden lg:block w-64 h-full shrink-0">
        <Sidebar />
      </aside>

      {/* Sidebar Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm">
          <aside className="w-64 h-full">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <div className="max-w-6xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
