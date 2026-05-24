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
  Gift,
  KeyRound,
  Lightbulb,
  Loader2,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
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
  primary_color?: string | null
  secondary_color?: string | null
  niche?: string | null
  target_audience?: string | null
  main_offer?: string | null
  audience_pains?: string | null
  content_goal?: string | null
}

type IdeaOption = {
  label: string
  brief: string
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
  const [generatingIdea, setGeneratingIdea] = useState(false)
  const [dashboardMode, setDashboardMode] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [generationBrief, setGenerationBrief] = useState('')
  const [search, setSearch] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [ideaOptions, setIdeaOptions] = useState<IdeaOption[]>([])
  const [notice, setNotice] = useState('')

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((project) => project.name.toLowerCase().includes(q))
  }, [projects, search])

  const totalCarousels = projects.reduce((sum, project) => sum + (project.carousels?.length || 0), 0)
  const plan = profile?.plan || 'free'
  const credits = profile?.credits || 0
  const maxCredits = maxCreditsByPlan[plan] || 1
  const isPaidPlan = plan !== 'free'
  const selectedBrand = brands.find((brand) => brand.id === selectedBrandId)
  const brandConfigured = Boolean(
    selectedBrand?.name &&
      selectedBrand?.niche &&
      selectedBrand?.target_audience &&
      (selectedBrand?.content_goal || selectedBrand?.main_offer || selectedBrand?.audience_pains)
  )

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    if (brandConfigured) loadBrandIdeas()
    else setIdeaOptions([])
  }, [brandConfigured, selectedBrandId])

  const shortLabel = (value: string) => {
    const clean = value.replace(/\s+/g, ' ').trim()
    if (clean.length <= 72) return clean
    return `${clean.slice(0, 69).trim()}...`
  }

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
      .select('id, name, is_default, primary_color, secondary_color, niche, target_audience, main_offer, audience_pains, content_goal')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    setProfile(profileData)
    setProjects(projectData || [])
    setBrands(brandData || [])
    const defaultBrand = brandData?.find((brand) => brand.is_default) || brandData?.[0]
    if (defaultBrand) setSelectedBrandId(defaultBrand.id)
    setLoading(false)
  }

  async function loadBrandIdeas() {
    try {
      const ideas = await Promise.all(
        ['', 'educativo', 'vendas'].map(async (seed) => {
          const res = await fetch('/api/carousel/brief-ideas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brandId: selectedBrandId, currentBrief: seed }),
          })
          const data = await res.json()
          if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao gerar ideia.')
          return {
            label: shortLabel(data.title || data.angles?.[0] || data.brief),
            brief: data.brief,
          }
        })
      )
      setIdeaOptions(ideas)
    } catch {
      setIdeaOptions([])
    }
  }

  async function createProject(openPrompt = false) {
    if (creating) return

    if (openPrompt && !brandConfigured) {
      setNotice('Antes de gerar um carrossel, configure seu Brand Kit com nicho, público e intenção.')
      router.push('/dashboard/marca')
      return
    }

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
    if (openPrompt && cleanPrompt) {
      params.set('auto', '1')
      params.set('prompt', cleanPrompt)
      sessionStorage.setItem(`studio:auto-prompt:${data.id}`, generationBrief || cleanPrompt)
    }
    if (selectedBrandId) params.set('brand', selectedBrandId)
    router.push(`/dashboard/studio?${params.toString()}`)
  }

  async function generateIdea() {
    if (generatingIdea) return

    if (!brandConfigured) {
      setNotice('Configure seu Brand Kit primeiro. A ideia é criada com base no nicho, público e intenção da sua marca.')
      router.push('/dashboard/marca')
      return
    }

    setGeneratingIdea(true)
    try {
      const res = await fetch('/api/carousel/brief-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId: selectedBrandId, currentBrief: prompt }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Não consegui gerar uma ideia agora.')
      setPrompt(shortLabel(data.title || data.angles?.[0] || data.brief))
      setGenerationBrief(data.brief)
    } catch (err: any) {
      setNotice(err.message || 'Erro ao gerar ideia com IA.')
    } finally {
      setGeneratingIdea(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101113] text-white">
        <Loader2 className="h-7 w-7 animate-spin text-purple-300" />
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0f1012] text-white">
      <header className="flex h-20 items-center justify-between border-b border-white/10 px-7">
        <div className="flex items-center gap-3">
          <Logo width={132} />
          <span className="rounded-md bg-white/[0.12] px-2 py-1 text-[11px] font-bold text-white/65">BETA</span>
        </div>
        <div className="flex items-center gap-7">
          <Link href="/dashboard/planos" className="text-lg text-white/90 hover:text-white">Planos</Link>
          <button onClick={() => setDashboardMode((current) => !current)} className="inline-flex items-center gap-3 rounded-full border border-purple-400/55 bg-purple-500/10 px-6 py-3 text-base font-bold text-purple-300">
            <KeyRound className="h-5 w-5" />
            {dashboardMode ? 'Dashboard ativo' : 'Ativar dashboard'}
          </button>
          <Link href="/dashboard/perfil" className="h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-[#25282d]">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.name || 'Perfil'} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-sm font-bold">{(profile?.name || 'D').slice(0, 1).toUpperCase()}</span>}
          </Link>
          <button onClick={logout} className="text-white/55 hover:text-white" aria-label="Sair"><LogOut className="h-7 w-7" /></button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-80px)] grid-cols-[350px_1fr]">
        <Sidebar projects={filteredProjects} search={search} setSearch={setSearch} creating={creating} createProject={createProject} profile={profile} maxCredits={maxCredits} />

        <main className="relative overflow-hidden bg-[#101113]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14)_1px,transparent_1.3px)] bg-[length:30px_30px] opacity-[0.16]" />
          {!dashboardMode ? (
            <section className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-[1160px] grid-cols-[minmax(0,1fr)_300px] gap-6 px-8 py-6">
              <div className="min-w-0">
                {notice && (
                  <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-purple-300/25 bg-purple-500/[0.12] px-5 py-4 text-sm font-semibold text-purple-100">
                    <span>{notice}</span>
                    <button onClick={() => setNotice('')} className="text-purple-100/70 hover:text-white" type="button">Fechar</button>
                  </div>
                )}
                <HeroStatusBanner plan={plan} credits={credits} maxCredits={maxCredits} isPaidPlan={isPaidPlan} />

                <h1 className="text-[58px] font-extrabold leading-none tracking-normal text-white">O que vamos criar hoje?</h1>
                <p className="mt-4 text-xl text-white/48">Descreva sua ideia e nossa IA transforma em um carrossel incrível.</p>

                <div className="mt-8 rounded-[24px] border border-white/12 bg-[#17181b]/95 p-6 shadow-[0_0_60px_rgba(0,0,0,0.24)]">
                  <div className="flex items-start gap-4">
                    <Sparkles className="mt-2 h-6 w-6 shrink-0 text-purple-300" />
                    <textarea
                      value={prompt}
                      onChange={(event) => {
                        setPrompt(event.target.value)
                        setGenerationBrief('')
                        setNotice('')
                      }}
                      placeholder="Descreva o carrossel que você quer gerar..."
                      className="min-h-[235px] w-full resize-none bg-transparent text-xl text-white outline-none placeholder:text-white/34"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-white/15 pt-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <button className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-5 py-3 text-base font-semibold">
                        <CreditCard className="h-5 w-5 text-white/55" /> Carrossel <ChevronDown className="h-4 w-4 text-white/55" />
                      </button>
                      <select value={selectedBrandId} onChange={(event) => setSelectedBrandId(event.target.value)} className="rounded-xl border border-white/12 bg-[#25262b] px-5 py-3 text-base font-semibold text-white outline-none">
                        {brands.length === 0 && <option value="">Brand Kit</option>}
                        {brands.map((brand) => <option key={brand.id} value={brand.id} className="bg-[#111214]">{brand.name}</option>)}
                      </select>
                      <button onClick={generateIdea} disabled={generatingIdea} className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-5 py-3 text-base font-semibold text-white disabled:opacity-50" type="button">
                        {generatingIdea ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-5 w-5 text-purple-300" />} Gerar ideia
                      </button>
                    </div>
                    <button onClick={() => createProject(true)} disabled={!prompt.trim() || creating || !brandConfigured} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white shadow-[0_10px_28px_rgba(168,85,247,0.35)] disabled:opacity-45" aria-label="Criar carrossel">
                      {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-7 w-7" />}
                    </button>
                  </div>
                </div>

                {brandConfigured && ideaOptions.length > 0 && (
                  <div className="mt-7 grid grid-cols-3 gap-4">
                    {ideaOptions.map((suggestion) => (
                      <button key={suggestion.label} onClick={() => { setPrompt(suggestion.label); setGenerationBrief(suggestion.brief) }} className="flex min-h-[70px] items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-3 text-left text-sm font-semibold leading-snug text-white hover:bg-white/[0.08]">
                        <Lightbulb className="h-5 w-5 shrink-0 text-white/70" /> {suggestion.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <aside className="space-y-5">
                <BrandRequirementCard selectedBrand={selectedBrand} />
                <div className="rounded-3xl border border-white/10 bg-[#17181b]/92 p-6">
                  <h2 className="mb-5 text-xl font-bold">Acesso rápido</h2>
                  <div className="space-y-3">
                    <QuickLink href="/dashboard/perfil" icon={<User className="h-5 w-5" />} label="Perfil" compact />
                    <QuickLink href="/dashboard/marca" icon={<Sparkles className="h-5 w-5" />} label="Brand Kit" compact />
                    <QuickLink href="/dashboard/planos" icon={<Calendar className="h-5 w-5" />} label="Planos" compact />
                  </div>
                </div>
              </aside>
            </section>
          ) : (
            <ActiveDashboard projects={projects} totalCarousels={totalCarousels} profile={profile} maxCredits={maxCredits} selectedBrand={selectedBrand} brandConfigured={brandConfigured} setDashboardMode={setDashboardMode} />
          )}
        </main>
      </div>
    </div>
  )
}

function HeroStatusBanner({ plan, credits, maxCredits, isPaidPlan }: { plan: string; credits: number; maxCredits: number; isPaidPlan: boolean }) {
  const content = isPaidPlan
    ? {
        title: 'Seu plano está ativo',
        text: `Você tem ${credits}/${maxCredits} créditos disponíveis para criar novos carrosséis.`,
        cta: 'Gerenciar plano',
        href: '/dashboard/planos',
      }
    : credits > 0
      ? {
          title: 'Sua primeira geração é gratuita',
          text: 'Configure seu Brand Kit, gere seu primeiro carrossel e depois escolha o plano ideal.',
          cta: 'Ver planos',
          href: '/dashboard/planos',
        }
      : {
          title: 'Seu teste gratuito já foi usado',
          text: 'Assine um plano para continuar criando carrosséis com IA e exportação pronta para publicar.',
          cta: 'Assinar agora',
          href: '/dashboard/planos?plan=starter',
        }

  return (
    <div className="mb-16 flex items-center justify-between gap-6 rounded-3xl border border-white/10 bg-[#17181b]/90 px-6 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div className="flex items-center gap-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/[0.18] text-purple-300">
          <Gift className="h-7 w-7" />
        </span>
        <div>
          <h2 className="text-lg font-bold">{content.title}</h2>
          <p className="mt-1 text-sm text-white/55">{content.text}</p>
        </div>
      </div>
      <Link href={content.href} className="shrink-0 rounded-xl bg-purple-500 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(168,85,247,0.28)]">
        {content.cta}
      </Link>
    </div>
  )
}

function Sidebar({ projects, search, setSearch, creating, createProject, profile, maxCredits }: { projects: Project[]; search: string; setSearch: (value: string) => void; creating: boolean; createProject: (openPrompt?: boolean) => void; profile: Profile | null; maxCredits: number }) {
  return (
    <aside className="flex flex-col border-r border-white/10 bg-[#101113] p-5">
      <div className="grid grid-cols-2 rounded-xl bg-[#1b1c1f] p-1">
        <button className="rounded-lg bg-[#303236] px-4 py-3 text-base font-bold">Meus projetos</button>
        <button className="rounded-lg px-4 py-3 text-base font-bold text-white/55">Compartilhados</button>
      </div>
      <label className="mt-7 flex h-[54px] items-center gap-3 rounded-xl border border-white/[0.08] bg-[#191a1d] px-4 text-lg text-white/55">
        <Search className="h-5 w-5" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar projetos" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/45" />
      </label>
      <button onClick={() => createProject(false)} disabled={creating} className="mt-7 flex h-[76px] w-full items-center justify-center gap-4 rounded-xl border border-dashed border-white/25 text-lg font-bold hover:bg-white/[0.04] disabled:opacity-60">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/[0.08]">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}</span>
        Criar projeto vazio
      </button>
      <h2 className="mb-5 mt-9 text-sm font-bold uppercase tracking-wide text-white/50">Recentes</h2>
      <div className="space-y-4">
        {projects.length === 0 ? <p className="rounded-xl bg-white/[0.04] p-4 text-sm text-white/45">Nenhum projeto ainda.</p> : projects.map((project) => (
          <Link key={project.id} href={`/dashboard/studio?project=${project.id}`} className="group flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#202126] text-purple-400"><Folder className="h-6 w-6" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-lg font-semibold">{project.name}</span>
              <span className="block truncate text-sm text-white/50">{project.carousels?.length || 0} carrossel(is) • {new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
            </span>
            <ChevronRight className="h-5 w-5 text-white/35 transition group-hover:translate-x-1 group-hover:text-white" />
          </Link>
        ))}
      </div>
      <div className="mt-auto rounded-2xl border border-white/10 bg-[#17181b] p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-300"><Gauge className="h-6 w-6" /></span>
          <div>
            <p className="text-sm text-white/50">Créditos disponíveis</p>
            <p className="text-3xl font-extrabold">{profile?.credits || 0}<span className="text-xl text-purple-400">/{maxCredits}</span></p>
          </div>
        </div>
        <div className="my-5 h-px bg-white/10" />
        <Link href="/dashboard/planos" className="flex items-center justify-between text-sm text-white/65 hover:text-white">
          Plano atual: {profile?.plan === 'free' ? 'Grátis' : profile?.plan || 'Grátis'} <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  )
}

function BrandRequirementCard({ selectedBrand }: { selectedBrand?: Brand }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#17181b]/92 p-6">
      <div className="mb-5 flex items-center gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300"><ShieldCheck className="h-5 w-5" /></span>
        <h2 className="text-lg font-bold">Brand Kit obrigatório</h2>
      </div>
      <p className="mb-6 text-sm leading-relaxed text-white/55">Configure seu Brand Kit para que nossa IA crie conteúdos alinhados com sua marca.</p>
      <div className="space-y-4 text-sm">
        <Requirement label="Nicho" done={Boolean(selectedBrand?.niche)} />
        <Requirement label="Público" done={Boolean(selectedBrand?.target_audience)} />
        <Requirement label="Intenção" done={Boolean(selectedBrand?.content_goal || selectedBrand?.main_offer || selectedBrand?.audience_pains)} />
      </div>
      <Link href="/dashboard/marca" className="mt-7 flex items-center justify-between rounded-xl bg-purple-500/35 px-5 py-4 text-sm font-bold text-white hover:bg-purple-500/45">
        Configurar Brand Kit <ChevronRight className="h-5 w-5" />
      </Link>
    </div>
  )
}

function ActiveDashboard({ projects, totalCarousels, profile, maxCredits, selectedBrand, brandConfigured, setDashboardMode }: { projects: Project[]; totalCarousels: number; profile: Profile | null; maxCredits: number; selectedBrand?: Brand; brandConfigured: boolean; setDashboardMode: (value: boolean) => void }) {
  return (
    <section className="relative mx-auto max-w-[1200px] px-10 py-10">
      <div className="grid gap-7 lg:grid-cols-3">
        <StatCard icon={<Gauge className="h-6 w-6" />} label="Créditos disponíveis" value={`${profile?.credits || 0}`} suffix={`/${maxCredits}`} color="purple" />
        <StatCard icon={<BarChart3 className="h-6 w-6" />} label="Carrosséis nos projetos" value={`${totalCarousels}`} color="cyan" />
        <StatCard icon={<CreditCard className="h-6 w-6" />} label="Plano atual" value={profile?.plan === 'free' ? 'Grátis' : profile?.plan || 'Grátis'} color="emerald" />
      </div>
      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,2fr)_380px]">
        <div className="rounded-[28px] border border-white/10 bg-[#17181b] p-10">
          <div className="mb-8 flex items-center justify-between gap-6">
            <h2 className="text-3xl font-bold">Projetos recentes</h2>
            <button onClick={() => setDashboardMode(false)} className="shrink-0 text-lg font-semibold text-white hover:text-purple-200">Criar novo</button>
          </div>
          <div className="space-y-5">
            {projects.slice(0, 5).map((project) => (
              <Link key={project.id} href={`/dashboard/studio?project=${project.id}`} className="flex items-center justify-between gap-6 rounded-[20px] bg-white/[0.06] px-7 py-6 text-xl transition hover:bg-white/[0.09]">
                <span className="truncate font-medium">{project.name}</span>
                <span className="shrink-0 text-base text-white/45">{project.carousels?.length || 0} carrossel(is)</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-7">
          <div className="rounded-[28px] border border-white/10 bg-[#17181b] p-10">
            <h2 className="mb-8 text-3xl font-bold">Acesso rápido</h2>
            <div className="space-y-4">
              <QuickLink href="/dashboard/perfil" icon={<User className="h-5 w-5" />} label="Perfil" />
              <QuickLink href="/dashboard/marca" icon={<Sparkles className="h-5 w-5" />} label="Brand Kit" />
              <QuickLink href="/dashboard/planos" icon={<Calendar className="h-5 w-5" />} label="Planos" />
            </div>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-[#17181b] p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Brand Kit ativo</h2>
                <p className="mt-1 text-sm text-white/45">{selectedBrand?.name || 'Nenhum kit selecionado'}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${brandConfigured ? 'bg-emerald-400/12 text-emerald-300' : 'bg-yellow-400/12 text-yellow-200'}`}>{brandConfigured ? 'Pronto' : 'Pendente'}</span>
            </div>
            <Link href="/dashboard/marca" className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-4 text-sm font-bold text-black">Configurar Brand Kit</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Requirement({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-6 w-6 rounded-full border ${done ? 'border-emerald-300 bg-emerald-300/15' : 'border-cyan-300/55 border-dashed'}`} />
      <span className={done ? 'text-white' : 'text-white/75'}>{label}</span>
    </div>
  )
}

function StatCard({ icon, label, value, suffix, color }: { icon: ReactNode; label: string; value: string; suffix?: string; color: 'purple' | 'cyan' | 'emerald' }) {
  const colorClass = { purple: 'bg-purple-500/[0.18] text-purple-300', cyan: 'bg-cyan-500/15 text-cyan-300', emerald: 'bg-emerald-500/15 text-emerald-300' }[color]
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#17181b] p-8">
      <div className={`mb-7 flex h-12 w-12 items-center justify-center rounded-2xl ${colorClass}`}>{icon}</div>
      <p className="text-lg text-white/60">{label}</p>
      <h2 className="mt-3 text-5xl font-extrabold capitalize leading-none">{value}{suffix && <span className="text-2xl text-white/35">{suffix}</span>}</h2>
    </div>
  )
}

function QuickLink({ href, icon, label, compact = false }: { href: string; icon: ReactNode; label: string; compact?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-5 rounded-[18px] bg-white/[0.06] font-medium text-white/85 hover:bg-white/[0.1] ${compact ? 'justify-between px-5 py-4 text-base' : 'px-7 py-5 text-xl'}`}>
      <span className="flex items-center gap-4"><span className="text-white/45">{icon}</span>{label}</span>
      {compact && <ChevronRight className="h-4 w-4 text-white/45" />}
    </Link>
  )
}
