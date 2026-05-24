'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUp,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Folder,
  Gauge,
  KeyRound,
  Loader2,
  LogOut,
  Plus,
  Search,
  Sparkles,
  User,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Logo } from '@/components/Logo'

type Profile = {
  credits: number
  plan: string
  name?: string | null
  avatar_url?: string | null
}

type Project = {
  id: string
  name: string
  created_at: string
  carousels?: { id: string; title: string; created_at: string; slide_count: number }[]
}

type Brand = {
  id: string
  name: string
  is_default?: boolean
}

const maxCreditsByPlan: Record<string, number> = {
  free: 1,
  starter: 30,
  pro: 80,
  agency: 200,
}

const suggestions = [
  'Ideias de posts para vender mais no Instagram',
  'Carrossel educativo para leads frios',
  'Sequência premium para lançamento',
]

export default function DashboardHome() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dashboardMode, setDashboardMode] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [search, setSearch] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState('')

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((project) => project.name.toLowerCase().includes(q))
  }, [projects, search])

  const totalCarousels = projects.reduce((sum, project) => sum + (project.carousels?.length || 0), 0)
  const maxCredits = maxCreditsByPlan[profile?.plan || 'free'] || 1
  const isFree = (profile?.plan || 'free') === 'free'

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    let { data: profileData } = await supabase
      .from('profiles')
      .select('credits, plan, name, avatar_url')
      .eq('id', user.id)
      .single()

    if (!profileData) {
      const { data: createdProfile } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Criador',
          avatar_url: user.user_metadata?.avatar_url,
          plan: 'free',
          credits: 1,
        })
        .select('credits, plan, name, avatar_url')
        .single()
      profileData = createdProfile
    }

    const { data: projectData } = await supabase
      .from('studio_projects')
      .select('id, name, created_at, carousels(id, title, created_at, slide_count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: brandData } = await supabase
      .from('brands')
      .select('id, name, is_default')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    setProfile(profileData)
    setProjects(projectData || [])
    setBrands(brandData || [])
    const defaultBrand = brandData?.find((brand) => brand.is_default) || brandData?.[0]
    if (defaultBrand) setSelectedBrandId(defaultBrand.id)
    setLoading(false)
  }

  async function createProject(openPrompt = false) {
    if (creating) return
    setCreating(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const cleanPrompt = prompt.trim()
    const projectName = cleanPrompt
      ? cleanPrompt.slice(0, 46)
      : `Projeto ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`

    const { data, error } = await supabase
      .from('studio_projects')
      .insert({ user_id: user.id, name: projectName })
      .select('id')
      .single()

    setCreating(false)

    if (error || !data) {
      alert('Não consegui criar o projeto agora.')
      return
    }

    const params = new URLSearchParams({ project: data.id })
    if (openPrompt && cleanPrompt) params.set('prompt', cleanPrompt)
    if (selectedBrandId) params.set('brand', selectedBrandId)
    router.push(`/dashboard/studio?${params.toString()}`)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101113] text-white">
        <Loader2 className="h-7 w-7 animate-spin text-cyan-300" />
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#101113] text-white">
      <header className="flex h-20 items-center justify-between border-b border-white/10 px-8">
        <div className="flex items-center gap-3">
          <Logo width={dashboardMode ? 132 : 46} />
          <span className="rounded-md bg-white/[0.12] px-2 py-1 text-[11px] font-bold text-white/65">BETA</span>
        </div>

        <div className="flex items-center gap-5">
          <Link href="/dashboard/planos" className="text-lg text-white/90 hover:text-white">
            Planos
          </Link>
          <button
            onClick={() => setDashboardMode((current) => !current)}
            className={`inline-flex items-center gap-3 rounded-full border px-5 py-3 text-base font-bold transition ${
              dashboardMode
                ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                : 'border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.07]'
            }`}
          >
            <KeyRound className="h-5 w-5" />
            {dashboardMode ? 'Dashboard ativo' : 'Ativar dashboard'}
          </button>
          <Link href="/dashboard/perfil" className="h-12 w-12 overflow-hidden rounded-full border border-white/25 bg-[#25282d]">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name || 'Perfil'} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-bold">
                {(profile?.name || 'D').slice(0, 1).toUpperCase()}
              </span>
            )}
          </Link>
          <button onClick={logout} className="text-white/55 hover:text-white" aria-label="Sair">
            <LogOut className="h-7 w-7" />
          </button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-80px)] grid-cols-[350px_1fr]">
        <aside className="border-r border-white/10 bg-[#101113] p-5">
          <div className="mb-8 grid grid-cols-2 rounded-xl bg-[#1b1c1f] p-1">
            <button className="rounded-lg bg-[#3a3b3f] px-4 py-3 text-base font-bold">Meus projetos</button>
            <button className="rounded-lg px-4 py-3 text-base font-bold text-white/55">Compartilhados</button>
          </div>

          <label className="mb-8 flex h-[52px] items-center gap-3 rounded-xl bg-[#1b1c1f] px-4 text-lg text-white/55">
            <Search className="h-5 w-5" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar projetos"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/45"
            />
          </label>

          <button
            onClick={() => createProject(false)}
            disabled={creating}
            className="mb-8 flex h-[74px] w-full items-center justify-center gap-4 rounded-xl border border-dashed border-white/25 text-lg font-bold hover:bg-white/[0.04] disabled:opacity-60"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/12">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </span>
            Criar projeto vazio
          </button>

          <h2 className="mb-5 text-sm font-bold uppercase tracking-wide text-white/50">Recentes</h2>
          <div className="space-y-4">
            {filteredProjects.length === 0 ? (
              <p className="rounded-xl bg-white/[0.04] p-4 text-sm text-white/45">Nenhum projeto ainda.</p>
            ) : (
              filteredProjects.map((project) => (
                <Link key={project.id} href={`/dashboard/studio?project=${project.id}`} className="group flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#202126] text-purple-400">
                    <Folder className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-semibold">{project.name}</span>
                    <span className="block truncate text-sm text-white/50">
                      {project.carousels?.length || 0} carrossel(is) • {new Date(project.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </span>
                  {dashboardMode && <ChevronRight className="h-5 w-5 text-white/35 transition group-hover:translate-x-1 group-hover:text-white" />}
                </Link>
              ))
            )}
          </div>
        </aside>

        <main className="relative overflow-hidden bg-[#111214]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14)_1px,transparent_1.3px)] bg-[length:30px_30px] opacity-18" />

          {!dashboardMode ? (
            <section className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-[1120px] flex-col px-8 pb-8 pt-16">
              <h1 className="max-w-[930px] text-[76px] font-extrabold leading-[0.98] tracking-normal text-white">
                Olá! O que vamos transformar em carrossel hoje?
              </h1>

              <div className="mt-16 rounded-[20px] border border-white/12 bg-[#17181b]/95 p-8 shadow-[0_0_60px_rgba(0,0,0,0.24)]">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Ex: crie um carrossel com 5 erros que fazem uma clínica perder pacientes no Instagram..."
                  className="min-h-[205px] w-full resize-none bg-transparent text-2xl text-white outline-none placeholder:text-white/32"
                />
                <div className="flex items-center justify-between border-t border-white/15 pt-7">
                  <div className="flex items-center gap-3">
                    <button className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-2 text-base font-semibold">Carrossel</button>
                    <select
                      value={selectedBrandId}
                      onChange={(event) => setSelectedBrandId(event.target.value)}
                      className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-2 text-base font-semibold text-white outline-none"
                    >
                      {brands.length === 0 && <option value="">Brand Kit</option>}
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id} className="bg-[#111214]">
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => createProject(true)}
                    disabled={!prompt.trim() || creating}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-[#414348] text-white disabled:opacity-45"
                    aria-label="Criar carrossel"
                  >
                    {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-7 w-7" />}
                  </button>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setPrompt(suggestion)}
                    className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-base font-semibold text-white hover:bg-white/[0.08]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {isFree && (
                <div className="mt-auto rounded-[20px] border border-white/16 bg-[#1a1b1e] p-8">
                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-bold">Sua primeira geração é gratuita.</h2>
                      <p className="mt-2 text-lg text-white/55">
                        Depois de testar o primeiro carrossel, vamos te mostrar o plano ideal para continuar criando.
                      </p>
                    </div>
                    <Link href="/dashboard/planos" className="rounded-full bg-purple-500 px-10 py-4 text-xl font-bold text-white shadow-[0_12px_35px_rgba(168,85,247,0.35)]">
                      Ver planos
                    </Link>
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section className="relative mx-auto max-w-[1200px] px-10 py-10">
              <div className="grid gap-7 lg:grid-cols-3">
                <StatCard icon={<Gauge className="h-6 w-6" />} label="Créditos disponíveis" value={`${profile?.credits || 0}`} suffix={`/${maxCredits}`} color="purple" />
                <StatCard icon={<BarChart3 className="h-6 w-6" />} label="Carrosséis nos projetos" value={`${totalCarousels}`} color="cyan" />
                <StatCard icon={<CreditCard className="h-6 w-6" />} label="Plano atual" value={profile?.plan === 'free' ? 'Grátis' : profile?.plan || 'Grátis'} color="emerald" />

                <div className="rounded-[28px] border border-white/10 bg-[#17181b] p-10 lg:col-span-2">
                  <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-3xl font-bold">Projetos recentes</h2>
                    <button onClick={() => setDashboardMode(false)} className="text-lg font-semibold text-white">
                      Criar novo
                    </button>
                  </div>
                  <div className="space-y-5">
                    {projects.slice(0, 5).map((project) => (
                      <Link key={project.id} href={`/dashboard/studio?project=${project.id}`} className="flex items-center justify-between rounded-[20px] bg-white/[0.06] px-7 py-6 text-xl hover:bg-white/[0.09]">
                        <span className="truncate font-medium">{project.name}</span>
                        <span className="shrink-0 text-base text-white/45">{project.carousels?.length || 0} carrossel(is)</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-[#17181b] p-10">
                  <h2 className="mb-8 text-3xl font-bold">Acesso rápido</h2>
                  <div className="space-y-4">
                    <QuickLink href="/dashboard/perfil" icon={<User className="h-5 w-5" />} label="Perfil" />
                    <QuickLink href="/dashboard/marca" icon={<Sparkles className="h-5 w-5" />} label="Brand Kit" />
                    <QuickLink href="/dashboard/planos" icon={<Calendar className="h-5 w-5" />} label="Planos" />
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: ReactNode
  label: string
  value: string
  suffix?: string
  color: 'purple' | 'cyan' | 'emerald'
}) {
  const colorClass = {
    purple: 'bg-purple-500/18 text-purple-300',
    cyan: 'bg-cyan-500/15 text-cyan-300',
    emerald: 'bg-emerald-500/15 text-emerald-300',
  }[color]

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#17181b] p-8">
      <div className={`mb-7 flex h-12 w-12 items-center justify-center rounded-2xl ${colorClass}`}>{icon}</div>
      <p className="text-lg text-white/60">{label}</p>
      <h2 className="mt-3 text-5xl font-extrabold capitalize leading-none">
        {value}
        {suffix && <span className="text-2xl text-white/35">{suffix}</span>}
      </h2>
    </div>
  )
}

function QuickLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-5 rounded-[18px] bg-white/[0.06] px-7 py-5 text-xl font-medium text-white/85 hover:bg-white/[0.1]">
      <span className="text-white/45">{icon}</span>
      {label}
    </Link>
  )
}
