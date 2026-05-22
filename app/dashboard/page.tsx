'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUp,
  BarChart3,
  Calendar,
  ChevronRight,
  CreditCard,
  FolderOpen,
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
    loadHub()
  }, [])

  async function loadHub() {
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
      <div className="flex min-h-screen items-center justify-center bg-[#1f2022] text-white">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#202124] text-white">
      <header className="flex h-[70px] items-center justify-between border-b border-white/10 px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-bold text-white/80">BETA</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/planos" className="hidden rounded-full px-3 py-2 text-xs font-bold text-white/80 hover:bg-white/10 sm:inline-flex">
            Planos
          </Link>
          <Link href="/dashboard/perfil" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-emerald-700 text-sm font-bold">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name || 'Perfil'} className="h-full w-full object-cover" />
            ) : (
              (profile?.name || 'D').slice(0, 1).toUpperCase()
            )}
          </Link>
          <button onClick={logout} className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/10">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-70px)] grid-cols-1 lg:grid-cols-[370px_1fr]">
        <aside className="border-r border-white/10 bg-[#1b1c1e] p-3">
          <div className="rounded-3xl border border-white/10 bg-[#1a1b1d] p-4">
            <div className="mb-4 grid grid-cols-2 rounded-full bg-black/20 p-1">
              <button className="rounded-full bg-[#3a3d40] px-4 py-3 text-sm font-bold">
                Meus projetos
              </button>
              <button className="rounded-full px-4 py-3 text-sm font-bold text-white/55">
                Compartilhados
              </button>
            </div>

            <label className="mb-6 flex items-center gap-2 rounded-full bg-[#2d3033] px-4 py-3 text-sm text-white/60">
              <Search className="h-4 w-4" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar projetos"
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/45"
              />
            </label>

            <div className="space-y-5">
              <button
                onClick={() => createProject(false)}
                disabled={creating}
                className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-white/15 px-3 py-3 text-left text-sm font-bold text-white/85 hover:bg-white/5 disabled:opacity-60"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </span>
                Criar projeto vazio
              </button>

              <div>
                <h2 className="mb-3 text-sm font-bold text-white/70">Recentes</h2>
                <div className="space-y-2">
                  {filteredProjects.length === 0 ? (
                    <p className="rounded-2xl bg-white/[0.03] p-4 text-sm text-white/50">
                      Nenhum projeto ainda. Crie seu primeiro carrossel pelo chat.
                    </p>
                  ) : (
                    filteredProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/dashboard/studio?project=${project.id}`}
                        className="group flex items-center gap-3 rounded-2xl p-2 hover:bg-white/[0.06]"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2d3033] text-[var(--accent)]">
                          <FolderOpen className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold">{project.name}</h3>
                          <p className="text-[11px] text-white/50">
                            {project.carousels?.length || 0} carrossel(is) · {new Date(project.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white" />
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="relative overflow-hidden p-6 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12)_1px,transparent_1.2px)] bg-[length:34px_34px] opacity-20" />
          <div className="relative mx-auto max-w-6xl">
            <div className="mb-10 flex items-center justify-end">
              <button
                onClick={() => setDashboardMode((current) => !current)}
                className={`flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-bold transition ${
                  dashboardMode
                    ? 'border-[var(--accent)]/40 bg-[var(--accent)]/15 text-white'
                    : 'border-white/15 bg-white/5 text-white/75 hover:bg-white/10'
                }`}
              >
                <KeyRound className="h-4 w-4" />
                {dashboardMode ? 'Dashboard ativo' : 'Ativar dashboard'}
              </button>
            </div>

            {!dashboardMode ? (
              <section className="pt-10">
                <h1 className="mb-7 max-w-4xl text-5xl font-semibold tracking-normal text-white md:text-6xl">
                  Olá! O que vamos transformar em carrossel hoje?
                </h1>

                <div className="rounded-[28px] border border-[var(--brand-primary)]/35 bg-[#1b1c1e]/95 p-4 shadow-[0_0_70px_rgba(124,58,237,0.16)]">
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Ex: crie um carrossel com 5 erros que fazem uma clínica perder pacientes no Instagram..."
                    className="min-h-44 w-full resize-none bg-transparent px-2 py-2 text-lg text-white outline-none placeholder:text-white/45"
                  />
                  <div className="flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="rounded-full bg-white/10 px-3 py-2 text-sm text-white/75">Carrossel</button>
                      <select
                        value={selectedBrandId}
                        onChange={(event) => setSelectedBrandId(event.target.value)}
                        className="rounded-full border border-white/10 bg-[#2d3033] px-3 py-2 text-sm text-white outline-none"
                      >
                        {brands.length === 0 && <option value="">Brand Kit padrão</option>}
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => createProject(true)}
                      disabled={!prompt.trim() || creating}
                      className="flex h-12 w-12 items-center justify-center self-end rounded-full bg-white text-black shadow-[0_0_34px_rgba(255,255,255,0.25)] disabled:opacity-40"
                      aria-label="Criar projeto"
                    >
                      {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    'Ideias de posts para vender mais no Instagram',
                    'Carrossel educativo para leads frios',
                    'Sequência premium para lançamento',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setPrompt(suggestion)}
                      className="rounded-full border border-white/12 bg-white/7 px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/12"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                {isFree && (
                  <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="font-bold">Sua primeira geração é gratuita.</h2>
                        <p className="mt-1 text-sm text-white/55">
                          Depois de testar o primeiro carrossel, vamos te mostrar o plano ideal para continuar criando.
                        </p>
                      </div>
                      <Link href="/dashboard/planos" className="rounded-full bg-[var(--brand-primary)] px-5 py-3 text-sm font-bold">
                        Ver planos
                      </Link>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <section className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-[#1b1c1e] p-6">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/20 text-[var(--brand-primary)]">
                    <Gauge className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-white/55">Créditos disponíveis</p>
                  <h2 className="mt-2 text-4xl font-bold">{profile?.credits || 0}<span className="text-lg text-white/35">/{maxCredits}</span></h2>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#1b1c1e] p-6">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-white/55">Carrosséis nos projetos</p>
                  <h2 className="mt-2 text-4xl font-bold">{totalCarousels}</h2>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#1b1c1e] p-6">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-white/55">Plano atual</p>
                  <h2 className="mt-2 text-4xl font-bold capitalize">{profile?.plan === 'free' ? 'Grátis' : profile?.plan}</h2>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#1b1c1e] p-6 lg:col-span-2">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Projetos recentes</h2>
                    <button onClick={() => setDashboardMode(false)} className="text-sm font-bold text-[var(--accent)]">
                      Criar novo
                    </button>
                  </div>
                  <div className="space-y-2">
                    {projects.slice(0, 5).map((project) => (
                      <Link key={project.id} href={`/dashboard/studio?project=${project.id}`} className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3 hover:bg-white/[0.08]">
                        <span className="font-semibold">{project.name}</span>
                        <span className="text-sm text-white/45">{project.carousels?.length || 0} carrossel(is)</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#1b1c1e] p-6">
                  <h2 className="mb-4 text-lg font-bold">Acesso rápido</h2>
                  <div className="space-y-2">
                    <Link href="/dashboard/perfil" className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 text-sm font-bold hover:bg-white/[0.08]">
                      <User className="h-4 w-4" /> Perfil
                    </Link>
                    <Link href="/dashboard/marca" className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 text-sm font-bold hover:bg-white/[0.08]">
                      <Sparkles className="h-4 w-4" /> Brand Kit
                    </Link>
                    <Link href="/dashboard/planos" className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 text-sm font-bold hover:bg-white/[0.08]">
                      <Calendar className="h-4 w-4" /> Planos
                    </Link>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
