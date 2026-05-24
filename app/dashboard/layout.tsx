'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Calendar, LogOut, Menu, Sparkles, User, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Logo } from '@/components/Logo'

type Profile = {
  name?: string | null
  avatar_url?: string | null
}

type Brand = {
  id: string
  name: string
  primary_color?: string | null
  secondary_color?: string | null
  is_default?: boolean | null
}

const quickLinks = [
  { name: 'Perfil', href: '/dashboard/perfil', icon: User },
  { name: 'Brand Kit', href: '/dashboard/marca', icon: Sparkles },
  { name: 'Planos', href: '/dashboard/planos', icon: Calendar },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single()

      const { data: brandData } = await supabase
        .from('brands')
        .select('id, name, primary_color, secondary_color, is_default')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      setProfile(data || { name: user.email?.split('@')[0] || 'Criador', avatar_url: user.user_metadata?.avatar_url })
      setBrands(brandData || [])
    }

    fetchProfile()
    window.addEventListener('profile-updated', fetchProfile)
    return () => window.removeEventListener('profile-updated', fetchProfile)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/studio')) {
    return <>{children}</>
  }

  const Navigation = () => (
    <>
      <Link href="/dashboard" className="mb-5 flex items-center gap-3 rounded-2xl border border-dashed border-white/15 px-4 py-4 text-sm font-bold text-white/85 hover:bg-white/[0.05]">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">+</span>
        Criar pelo Studio
      </Link>

      <div className="space-y-2">
        {quickLinks.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                active ? 'bg-[#2f3135] text-white' : 'text-white/55 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </div>

      {pathname === '/dashboard/marca' && (
        <div className="mt-5 border-t border-white/10 pt-5">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-white/55">Suas marcas</h2>
            <span className="text-xs font-bold text-cyan-300">{brands.length}</span>
          </div>
          <div className="space-y-2">
            {brands.length === 0 ? (
              <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-white/45">Nenhum Brand Kit criado.</p>
            ) : (
              brands.map((brand) => (
                <a
                  key={brand.id}
                  href={`/dashboard/marca?brand=${brand.id}`}
                  className="block rounded-2xl bg-white/[0.04] p-3 text-left transition hover:bg-white/[0.08]"
                >
                  <span className="block truncate text-sm font-bold">{brand.name}</span>
                  <span className="mt-2 flex items-center gap-1">
                    <i className="h-3 w-3 rounded-full border border-white/20" style={{ background: brand.primary_color || '#a855f7' }} />
                    <i className="h-3 w-3 rounded-full border border-white/20" style={{ background: brand.secondary_color || '#22d3ee' }} />
                    {brand.is_default && <span className="ml-auto text-[10px] font-bold text-cyan-300">PADRÃO</span>}
                  </span>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-[#111113] text-white">
      <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[#111113] px-5 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Logo />
          <span className="rounded-md bg-white/[0.12] px-2 py-1 text-[11px] font-bold text-white/70">BETA</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/planos" className="hidden px-3 py-2 text-sm font-medium text-white/80 hover:text-white sm:inline-flex">
            Planos
          </Link>
          <Link href="/dashboard" className="hidden rounded-full border border-cyan-400/35 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-300 sm:inline-flex">
            Dashboard ativo
          </Link>
          <Link href="/dashboard/perfil" className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-[#2b2e33] text-sm font-bold">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.name || 'Perfil'} className="h-full w-full object-cover" /> : (profile?.name || 'D').slice(0, 1).toUpperCase()}
          </Link>
          <button onClick={handleLogout} className="hidden h-10 w-10 items-center justify-center rounded-full text-white/55 hover:bg-white/10 hover:text-white sm:flex" aria-label="Sair">
            <LogOut className="h-5 w-5" />
          </button>
          <button onClick={() => setMenuOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center rounded-full text-white/75 hover:bg-white/10 lg:hidden" aria-label="Menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-80px)] grid-cols-1 lg:grid-cols-[320px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[#111113] p-5 lg:block">
          <div className="sticky top-5 rounded-2xl bg-[#191a1d] p-3">
            <Navigation />
          </div>
        </aside>

        {menuOpen && (
          <div className="border-b border-white/10 bg-[#111113] p-4 lg:hidden">
            <div className="rounded-2xl bg-[#191a1d] p-3">
              <Navigation />
            </div>
          </div>
        )}

        <main className="relative overflow-hidden bg-[#111113] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.13)_1px,transparent_1.2px)] bg-[length:34px_34px] opacity-20" />
          <div className="relative mx-auto w-full max-w-6xl overflow-hidden">{children}</div>
        </main>
      </div>
    </div>
  )
}
