'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Plus, Image as ImageIcon, Sparkles, Clock, Calendar, Eye, Download, Trash2, X, RefreshCw, Check, Copy, Share2, HelpCircle, Trophy, BookOpen, ChevronRight, Award, Play } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import DOMPurify from 'isomorphic-dompurify'
import JSZip from 'jszip'

export default function DashboardHome() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ credits: number; plan: string } | null>(null)
  const [carousels, setCarousels] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [selectedCarousel, setSelectedCarousel] = useState<any | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [exportLoading, setExportLoading] = useState(false)
  const supabase = createClient()
  const [brand, setBrand] = useState<{ primary_color: string; secondary_color: string } | null>(null)

  // Onboarding & Gamification States
  const [brandCount, setBrandCount] = useState(0)
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [onboardingClaimed, setOnboardingClaimed] = useState(false)
  const [claimingOnboarding, setClaimingOnboarding] = useState(false)
  const [copiedReferral, setCopiedReferral] = useState(false)
  const [activeHelpModal, setActiveHelpModal] = useState<string | null>(null)

  // Drag state for interactive slider preview inside modal
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)

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
        .select('id, title, status, created_at, format, slide_count, html_content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (carouselsData) {
        setCarousels(carouselsData.slice(0, 6)) // Show up to 6 recent carousels
        setTotalCount(carouselsData.length)
      }

      // 3. Fetch brands count + colors
      const { data: brandsData, count: bCount } = await supabase
        .from('brands')
        .select('primary_color, secondary_color', { count: 'exact' })
        .eq('user_id', user.id)
        .limit(1)

      setBrandCount(bCount || 0)
      if (brandsData && brandsData.length > 0) {
        setBrand(brandsData[0])
      }
      setUserId(user.id)
      setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'Criador')
      setOnboardingClaimed(localStorage.getItem(`onboarding_claimed_${user.id}`) === 'true')

      setLoading(false)
    }

    loadDashboardData()
  }, [])

  const maxCredits = profile?.plan === 'free' ? 1 : profile?.plan === 'starter' ? 30 : profile?.plan === 'pro' ? 80 : 200

  const claimOnboardingBonus = async () => {
    if (claimingOnboarding || onboardingClaimed) return
    setClaimingOnboarding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const newCredits = (profile?.credits || 0) + 1
      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id)

      if (error) throw error
      
      setProfile(prev => prev ? { ...prev, credits: newCredits } : null)
      setOnboardingClaimed(true)
      localStorage.setItem(`onboarding_claimed_${user.id}`, 'true')
      window.dispatchEvent(new Event('profile-updated'))
      alert('Parabéns! 1 Crédito Bônus foi adicionado à sua conta!')
    } catch (err) {
      console.error(err)
      alert('Erro ao resgatar bônus. Tente novamente.')
    } finally {
      setClaimingOnboarding(false)
    }
  }

  const copyReferralLink = () => {
    const link = `https://deslize.app/join?ref=${userId.substring(0, 8)}`
    navigator.clipboard.writeText(link)
    setCopiedReferral(true)
    setTimeout(() => setCopiedReferral(false), 3000)
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    
    if (!confirm('Deseja realmente excluir este carrossel?')) return

    try {
      const { error } = await supabase
        .from('carousels')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Erro ao excluir carrossel')
      } else {
        setCarousels(prev => prev.filter(c => c.id !== id))
        if (selectedCarousel && selectedCarousel.id === id) {
          setSelectedCarousel(null)
        }
      }
    } catch (err) {
      console.error(err)
      alert('Erro de conexão ao excluir carrossel')
    }
  }

  const handleExport = async (carousel: any) => {
    setExportLoading(true)
    try {
      const res = await fetch('/api/carousel/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          html: applyBrandColors(carousel.html_content),
          slideCount: carousel.slide_count || 7,
          carouselId: carousel.id
        })
      })
      
      const data = await res.json()
      
      if (data.urls && data.urls.length > 0) {
        const zip = new JSZip()
        
        // Fetch each slide image and add to the ZIP
        await Promise.all(
          data.urls.map(async (url: string, index: number) => {
            const imgRes = await fetch(url)
            const blob = await imgRes.blob()
            zip.file(`slide_${index + 1}.png`, blob)
          })
        )
        
        // Generate ZIP file and download
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const downloadUrl = URL.createObjectURL(zipBlob)
        const a = document.createElement('a')
        a.href = downloadUrl
        const filename = `${(carousel.title || 'carrossel').trim().replace(/\s+/g, '_')}.zip`
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(downloadUrl)
      } else {
        alert(data.error || 'Erro ao exportar carrossel')
      }
    } catch (err) {
      console.error(err)
      alert('Erro de conexão ao exportar')
    } finally {
      setExportLoading(false)
    }
  }

  // Interactive slide swipe handlers
  const handleStart = (clientX: number) => {
    setIsDragging(true)
    setStartX(clientX)
    setDragOffset(0)
  }

  const handleMove = (clientX: number) => {
    if (!isDragging) return
    const diff = clientX - startX
    setDragOffset(diff)
  }

  const handleEnd = (clientX?: number) => {
    if (!isDragging) return
    setIsDragging(false)
    
    const threshold = 80 // Min drag distance to flip page
    const diff = clientX ? clientX - startX : 0
    const slideCount = selectedCarousel?.slide_count || 7

    if (diff < -threshold && currentSlide < slideCount - 1) {
      setCurrentSlide(prev => prev + 1)
    } else if (diff > threshold && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1)
    }
    setDragOffset(0)
  }

  // Helper to format date
  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // Re-apply current brand colors to stored HTML (which has old colors baked in)
  const applyBrandColors = (html: string): string => {
    if (!html || !brand?.primary_color) return html
    const p = brand.primary_color
    const s = brand.secondary_color || brand.primary_color

    // 1. Replace slide-logo-dot inline background-color (handles both attribute orders)
    let result = html
      .replace(/(<div[^>]*class="slide-logo-dot"[^>]*style=")background-color:[^;"]+/g, `$1background-color: ${p}`)
      .replace(/(style="background-color:)[^"]+(")[^>]*class="slide-logo-dot"/g, `$1${p}$2 class="slide-logo-dot"`)

    // 2. Inject a CSS override block to recolor gradient-span and slide-tag
    const override = `<style>
      .gradient-span {
        background-image: linear-gradient(135deg, ${p}, ${s}) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        color: transparent !important;
      }
      .slide-tag { color: ${p} !important; }
      svg[style*="color"] { color: ${p} !important; }
    </style>`
    return override + result
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

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Onboarding & Recent Activity (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Gamified Onboarding Progress Bar (Melhoria 14) */}
          <div className="bg-[var(--surface-dark)]/85 backdrop-blur-md border border-[var(--border-dark)] rounded-3xl p-6 relative overflow-hidden">
            {/* Soft glow background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-primary)]/5 rounded-full blur-[85px] pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-lg font-[family-name:var(--font-bricolage)] font-bold text-white">Sua Jornada de Onboarding</h2>
                </div>
                <p className="text-xs text-[var(--text-muted)]">Complete as etapas rápidas abaixo para começar a faturar.</p>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-2xl shrink-0 self-start sm:self-auto">
                <Award className="w-4 h-4 text-[var(--accent)]" />
                {(() => {
                  const onboardingSteps = [
                    { id: 1, done: true },
                    { id: 2, done: brandCount > 0 },
                    { id: 3, done: totalCount > 0 },
                  ];
                  const completed = onboardingSteps.filter(s => s.done).length;
                  const progress = Math.round((completed / onboardingSteps.length) * 100);
                  return <span className="text-xs font-bold text-white">{progress}% concluído</span>;
                })()}
              </div>
            </div>

            {/* Progress track */}
            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-6 border border-white/5">
              {(() => {
                const onboardingSteps = [
                  { id: 1, done: true },
                  { id: 2, done: brandCount > 0 },
                  { id: 3, done: totalCount > 0 },
                ];
                const completed = onboardingSteps.filter(s => s.done).length;
                const progress = Math.round((completed / onboardingSteps.length) * 100);
                return (
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--accent)] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                    style={{ width: `${progress}%` }}
                  ></div>
                );
              })()}
            </div>

            {/* Checklist items */}
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 1, name: 'Criar conta de criador', done: true, desc: 'Sua conta de criador está ativa e segura.', href: '#' },
                { id: 2, name: 'Configurar primeiro Brand Kit', done: brandCount > 0, desc: 'Defina suas cores, fontes e logotipo da marca.', href: '/dashboard/marca' },
                { id: 3, name: 'Gerar seu primeiro carrossel', done: totalCount > 0, desc: 'Escreva e formate seu primeiro post viral com IA.', href: '/dashboard/novo' },
              ].map((step) => (
                <div 
                  key={step.id}
                  className={`flex items-start gap-4 p-3.5 rounded-2xl border transition-all duration-300 ${
                    step.done 
                      ? 'bg-emerald-500/5 border-emerald-500/10' 
                      : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {step.done ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                        <Check className="w-3 h-3 stroke-[3px]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-xs font-bold text-white/50 bg-white/5">
                        {step.id}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold leading-tight ${step.done ? 'text-emerald-400 line-through opacity-85' : 'text-white'}`}>
                      {step.name}
                    </h4>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                  {!step.done && step.href !== '#' && (
                    <Link 
                      href={step.href} 
                      className="text-[10px] font-bold text-[var(--accent)] hover:text-white flex items-center gap-0.5 shrink-0 self-center bg-white/5 hover:bg-[var(--brand-primary)]/20 border border-white/10 rounded-lg px-2.5 py-1.5 transition-all"
                    >
                      Configurar <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Celebrative banner */}
            {brandCount > 0 && totalCount > 0 && (
              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-[var(--brand-primary)]/20 to-[var(--accent)]/20 border border-[var(--brand-primary)]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Trophy className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Onboarding Concluído! 🎉</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">Você completou todas as etapas obrigatórias.</p>
                  </div>
                </div>
                {onboardingClaimed ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl whitespace-nowrap">
                    Bônus Resgatado ✓
                  </span>
                ) : (
                  <button 
                    onClick={claimOnboardingBonus}
                    disabled={claimingOnboarding}
                    className="btn-primary py-2 px-4 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
                  >
                    {claimingOnboarding ? 'Resgatando...' : 'Resgatar Crédito Bônus'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recent Activity / Carousels */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white">Seus Carrosséis</h2>
              {carousels.length > 0 && (
                <Link 
                  href="/dashboard/historico" 
                  className="text-xs font-semibold text-[var(--accent)] hover:text-white flex items-center gap-1 transition-colors"
                >
                  Ver todos <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {carousels.length === 0 ? (
              /* Beautiful Illustrated empty state (Melhoria 10) */
              <div className="bg-[var(--surface-dark)]/60 backdrop-blur-sm border border-[var(--border-dark)] rounded-3xl p-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--brand-primary)]/5 to-transparent pointer-events-none"></div>
                
                {/* Neon decorative circles */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[var(--brand-primary)] to-[var(--accent)] p-[1px] mx-auto mb-6 shadow-[0_0_35px_rgba(124,58,237,0.25)] relative flex items-center justify-center animate-bounce duration-[1500ms]">
                  <div className="w-full h-full rounded-full bg-[#07070d] flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[var(--accent)]" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">Pronto para criar posts magnéticos?</h3>
                <p className="text-xs text-[var(--text-muted)] mb-8 max-w-sm mx-auto leading-relaxed">
                  Deixe a inteligência artificial formular copies de alta conversão e designs elegantes consistentes com sua identidade visual.
                </p>

                <Link 
                  href="/dashboard/novo" 
                  className="btn-primary inline-flex items-center gap-2 font-bold px-6 py-3 shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] transition-all scale-100 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  Criar primeiro carrossel
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {carousels.map((carousel) => (
              <div 
                key={carousel.id} 
                onClick={() => {
                  setSelectedCarousel(carousel)
                  setCurrentSlide(0)
                }}
                className="group bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl overflow-hidden hover:border-[var(--brand-primary)]/50 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                {/* Cover Thumbnail Stack - Real Live HTML Slide Preview */}
                <div className="aspect-[4/5] bg-gradient-to-br from-[#ffffff05] to-[#ffffff0a] relative flex items-center justify-center border-b border-[var(--border-dark)] overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise-pattern-with-subtle-cross-lines.png')] opacity-10"></div>
                  
                  {/* Live Preview Container */}
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                    <div className="w-[400px] h-[500px] shrink-0 origin-center scale-[0.55] sm:scale-[0.6] md:scale-[0.55] lg:scale-[0.58] xl:scale-[0.65] rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative" style={{ backgroundColor: '#07070D' }}>
                      <style dangerouslySetInnerHTML={{__html: `
                        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Share+Tech+Mono&family=Playfair+Display:ital,wght@0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Outfit:wght@700;800&family=Inter:wght@300;400;500;600&display=swap');
                        .preview-track-thumb { display: flex; height: 100%; width: 100%; }
                        .ig-slide { width: 100%; min-width: 100%; flex-shrink: 0; height: 100%; padding: 40px; padding-top: 85px; padding-bottom: 85px; position: relative; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
                        .slide-tag { position: absolute; top: 40px; left: 40px; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: 2px; }
                        .slide-logo { position: absolute; top: 40px; right: 40px; display: flex; align-items: center; gap: 8px; }
                        .slide-logo-dot { width: 16px; height: 16px; border-radius: 50%; }
                        .slide-logo-text { font-size: 14px; font-weight: 700; letter-spacing: -0.5px; }
                        .slide-num-bg { position: absolute; bottom: 0; right: 0; font-family: inherit; font-size: 240px; font-weight: 800; color: rgba(255,255,255,0.03); line-height: 0.8; }
                        .slide-h { font-family: inherit; font-weight: 800; line-height: 1.1; margin-bottom: 24px; position: relative; z-index: 10; font-size: 32px;}
                        .slide-body { font-size: 16px; color: rgba(255,255,255,0.7); line-height: 1.6; max-width: 90%; position: relative; z-index: 10; }
                        .slide-progress { position: absolute; bottom: 40px; left: 40px; right: 40px; display: flex; align-items: center; gap: 16px; }
                        .progress-track { flex: 1; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
                        .progress-fill { height: 100%; background: white; border-radius: 2px; }
                        .progress-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); }
                      `}} />
                      <div 
                        className="preview-track-thumb"
                        dangerouslySetInnerHTML={{ __html: carousel.html_content ? DOMPurify.sanitize(applyBrandColors(carousel.html_content), { FORCE_BODY: true, ADD_TAGS: ['style', 'link'], ADD_ATTR: ['href', 'rel', 'type'] }) : '' }}
                      ></div>
                    </div>
                  </div>

                  {/* Slide count badge overlay */}
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1 text-[10px] font-bold text-white/90 z-10 flex items-center gap-1 shadow-md">
                    <span>{carousel.slide_count} slides</span>
                  </div>
                </div>

                {/* Info and Actions */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400">
                        Pronto
                      </span>
                      <span className="text-xs text-[var(--text-muted2)]">{carousel.format || 'Carrossel'}</span>
                    </div>
                    <h3 className="font-bold text-white mb-1 group-hover:text-[var(--accent)] transition-colors truncate">
                      {carousel.title}
                    </h3>
                  </div>
                  
                  <div className="mt-6 pt-3 border-t border-[var(--border-dark)] flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)] inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(carousel.created_at)}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => handleDelete(carousel.id, e)}
                        className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-[var(--accent)] hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <Eye className="w-4 h-4" />
                        Visualizar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      </div> {/* Close Left Column (lg:col-span-2) */}
      
      {/* Right Column: Refer & Earn + Help Center (1/3 width) (Melhorias 15, 10) */}
      <div className="space-y-6 lg:sticky lg:top-24">
        {/* Indique e Ganhe Card */}
        <div className="bg-[var(--surface-dark)]/80 backdrop-blur-md border border-[var(--border-dark)] rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#06B6D4]/5 rounded-full blur-[45px] pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-[#06B6D4]" />
            <h3 className="font-[family-name:var(--font-bricolage)] font-bold text-white text-sm">Indique e Ganhe 🎁</h3>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-5">
            Compartilhe o Deslize com amigos. Quando eles criarem uma conta, você ganha <span className="text-[#06B6D4] font-bold">+2 créditos</span> e eles ganham <span className="text-[#06B6D4] font-bold">+1 crédito</span> de boas-vindas!
          </p>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50">Seu Link Exclusivo</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={`https://deslize.app/join?ref=${userId ? userId.substring(0, 8) : 'code'}`}
                className="flex-1 bg-black/40 border border-[var(--border-dark)] rounded-xl px-3 py-2 text-[10px] text-white/70 font-mono focus:outline-none truncate"
              />
              <button
                onClick={copyReferralLink}
                className="p-2 bg-white/5 hover:bg-[#06B6D4]/20 border border-white/10 hover:border-[#06B6D4]/30 rounded-xl text-white transition-all shrink-0 flex items-center justify-center cursor-pointer"
                title="Copiar link"
              >
                {copiedReferral ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/75" />}
              </button>
            </div>
          </div>
        </div>

        {/* Central de Ajuda Widget */}
        <div className="bg-[var(--surface-dark)]/80 backdrop-blur-md border border-[var(--border-dark)] rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-[var(--brand-primary)]" />
            <h3 className="font-[family-name:var(--font-bricolage)] font-bold text-white text-sm">Central de Ajuda 💡</h3>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-5">
            Aprenda a otimizar suas criações em menos de 1 minuto com os guias rápidos abaixo.
          </p>
          <div className="space-y-3">
            {[
              { key: 'brand', title: 'Configurar Marca em 1 min', desc: 'Como aplicar fontes e cores consistentes.' },
              { key: 'ia', title: 'Domine a Escrita com IA', desc: 'Dicas de prompts para copies magnéticas.' },
              { key: 'export', title: 'Exportação Perfeita', desc: 'Como baixar em alta resolução para postar.' }
            ].map((tutorial) => (
              <button
                key={tutorial.key}
                onClick={() => setActiveHelpModal(tutorial.key)}
                className="w-full text-left p-3 rounded-2xl bg-black/20 hover:bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex items-center gap-3 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[var(--brand-primary)]/10 group-hover:bg-[var(--brand-primary)]/20 border border-[var(--brand-primary)]/20 flex items-center justify-center shrink-0">
                  <Play className="w-3.5 h-3.5 text-[var(--accent)] fill-current" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-bold text-white group-hover:text-[var(--accent)] transition-colors leading-tight truncate">{tutorial.title}</h4>
                  <p className="text-[9px] text-[var(--text-muted2)] truncate mt-0.5">{tutorial.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
      
      </div> {/* Close Main Grid (grid-cols-1 lg:grid-cols-3) */}

      {/* Slide-by-slide Preview Modal */}
      {selectedCarousel && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-[#0b0b0e] border border-[var(--border-dark)] rounded-3xl w-full max-w-4xl p-6 md:p-8 relative flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedCarousel(null)}
              className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-white rounded-full bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Sidebar Details */}
            <div className="w-full md:w-1/3 flex flex-col justify-between py-2">
              <div>
                <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2 block">Visualizador</span>
                <h2 className="text-2xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-2 leading-tight">
                  {selectedCarousel.title}
                </h2>
                
                <div className="space-y-3 mt-6 text-sm text-[var(--text-muted)]">
                  <div className="flex justify-between border-b border-[var(--border-dark)] pb-2">
                    <span>Tema:</span>
                    <span className="text-white font-medium">{selectedCarousel.format || 'Padrão'}</span>
                  </div>
                  <div className="flex justify-between border-b border-[var(--border-dark)] pb-2">
                    <span>Slides:</span>
                    <span className="text-white font-medium">{selectedCarousel.slide_count}</span>
                  </div>
                  <div className="flex justify-between border-b border-[var(--border-dark)] pb-2">
                    <span>Criado em:</span>
                    <span className="text-white font-medium">{formatDate(selectedCarousel.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <button 
                  onClick={() => handleExport(selectedCarousel)}
                  disabled={exportLoading}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-75"
                >
                  {exportLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Exportando...</>
                  ) : (
                    <><Download className="w-4 h-4" /> Exportar Imagens (PNG)</>
                  )}
                </button>
                <button 
                  onClick={() => setSelectedCarousel(null)}
                  className="w-full bg-[#ffffff08] hover:bg-[#ffffff12] text-white border border-[var(--border-dark)] py-3 rounded-xl text-sm font-semibold transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Carousel Viewport Box */}
            <div className="w-full md:w-2/3 flex flex-col justify-center items-center">
              {/* Instagram Frame */}
              <div className="w-full max-w-[360px] bg-[#0d0d12] rounded-xl overflow-hidden relative shadow-2xl border border-white/10 flex flex-col">
                {/* Header mock */}
                <div className="flex items-center gap-3 p-3 border-b border-white/10 bg-[#0d0d12]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                    <div className="w-full h-full rounded-full bg-black border border-black flex items-center justify-center text-[10px] font-bold text-white">SM</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">suamarca</div>
                    <div className="text-[10px] text-gray-400 leading-tight">suamarca.com.br</div>
                  </div>
                </div>

                {/* Slider */}
                <div style={{ position: 'relative' }}>
                  <div 
                    className="relative overflow-hidden bg-[#0A0A0F]"
                    ref={viewportRef}
                    style={{
                      aspectRatio: '4/5',
                      cursor: isDragging ? "grabbing" : "grab",
                      userSelect: "none"
                    }}
                    onTouchStart={(e) => handleStart(e.touches[0].clientX)}
                    onTouchMove={(e) => handleMove(e.touches[0].clientX)}
                    onTouchEnd={(e) => handleEnd(e.changedTouches[0]?.clientX)}
                    onMouseDown={(e) => { handleStart(e.clientX); e.preventDefault(); }}
                    onMouseMove={(e) => { if (isDragging) handleMove(e.clientX); }}
                    onMouseUp={(e) => handleEnd(e.clientX)}
                    onMouseLeave={() => handleEnd()}
                  >
                    {/* Inject styles */}
                    <style dangerouslySetInnerHTML={{__html: `
                      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Share+Tech+Mono&family=Playfair+Display:ital,wght@0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Outfit:wght@700;800&family=Inter:wght@300;400;500;600&display=swap');
                      .preview-track { display: flex; height: 100%; }
                      .ig-slide { width: 100%; min-width: 100%; flex-shrink: 0; height: 100%; padding: 40px; padding-top: 85px; padding-bottom: 85px; position: relative; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
                      .slide-tag { position: absolute; top: 40px; left: 40px; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: 2px; }
                      .slide-logo { position: absolute; top: 40px; right: 40px; display: flex; items-center; gap: 8px; }
                      .slide-logo-dot { width: 16px; height: 16px; border-radius: 50%; }
                      .slide-logo-text { font-size: 14px; font-weight: 700; letter-spacing: -0.5px; }
                      .slide-num-bg { position: absolute; bottom: 0; right: 0; font-family: inherit; font-size: 240px; font-weight: 800; color: rgba(255,255,255,0.03); line-height: 0.8; }
                      .slide-h { font-family: inherit; font-weight: 800; line-height: 1.1; margin-bottom: 24px; position: relative; z-index: 10; font-size: 32px;}
                      .slide-body { font-size: 16px; color: rgba(255,255,255,0.7); line-height: 1.6; max-width: 90%; position: relative; z-index: 10; }
                      .slide-progress { position: absolute; bottom: 40px; left: 40px; right: 40px; display: flex; align-items: center; gap: 16px; }
                      .progress-track { flex: 1; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
                      .progress-fill { height: 100%; background: white; border-radius: 2px; }
                      .progress-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); }
                    `}} />
                    
                    <div 
                      className="preview-track"
                      style={{ 
                        display: "flex", 
                        height: "100%",
                        width: "100%",
                        transform: `translateX(calc(-${currentSlide * 100}% + ${dragOffset}px))`,
                        transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.215, 0.61, 0.355, 1)"
                      }}
                      dangerouslySetInnerHTML={{ __html: selectedCarousel?.html_content ? DOMPurify.sanitize(applyBrandColors(selectedCarousel.html_content), { FORCE_BODY: true, ADD_TAGS: ['style', 'link'], ADD_ATTR: ['href', 'rel', 'type'] }) : '' }}
                    ></div>
                  </div>

                  {/* Indicator overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10 flex items-center gap-3">
                    <div className="flex-1 h-[3px] bg-white/25 rounded overflow-hidden">
                      <div 
                        className="h-full bg-white rounded transition-all duration-300"
                        style={{ width: `${((currentSlide + 1) / selectedCarousel.slide_count) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-[11px] font-bold text-white/80 font-mono">
                      {currentSlide + 1}/{selectedCarousel.slide_count}
                    </div>
                  </div>
                </div>

                {/* IG Action Buttons */}
                <div className="flex justify-between items-center p-3 border-t border-white/10 bg-[#0d0d12] text-white">
                  <div className="flex gap-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </div>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>

                {/* Dots Navigation */}
                <div className="flex justify-center gap-1.5 pb-4 bg-[#0d0d12]">
                  {Array.from({ length: selectedCarousel.slide_count }).map((_, i) => (
                    <div 
                      key={i} 
                      onClick={() => setCurrentSlide(i)}
                      className={`w-[6px] h-[6px] rounded-full transition-all cursor-pointer ${
                        currentSlide === i ? 'bg-[#7c3aed] scale-120' : 'bg-white/20 hover:bg-white/40'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal overlays (Melhoria 10) */}
      {activeHelpModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#0b0b0e] border border-[var(--border-dark)] rounded-3xl w-full max-w-lg p-6 relative overflow-hidden">
            <button 
              onClick={() => setActiveHelpModal(null)}
              className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-white rounded-full bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {activeHelpModal === 'brand' && (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <h3 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-2">Configurar Marca em 1 min 🎨</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                  Ter uma identidade consistente é a chave para o reconhecimento de marca. Siga estes passos simples:
                </p>
                <ul className="space-y-3 text-xs text-white/80">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-[var(--accent)] font-bold shrink-0 mt-0.5">1</span>
                    <span>Acesse a página <strong>Identidade Visual</strong> no menu lateral.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-[var(--accent)] font-bold shrink-0 mt-0.5">2</span>
                    <span>Escolha um nome para sua marca e envie seu logotipo preferido.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-[var(--accent)] font-bold shrink-0 mt-0.5">3</span>
                    <span>Selecione cores complementares para o Fundo, Texto e Destaques (ou escolha uma de nossas paletas prontas de grife!).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-[var(--accent)] font-bold shrink-0 mt-0.5">4</span>
                    <span>Escolha as famílias tipográficas do Google Fonts e salve o Brand Kit.</span>
                  </li>
                </ul>
              </div>
            )}

            {activeHelpModal === 'ia' && (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-[#06B6D4]" />
                </div>
                <h3 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-2">Domine a Escrita com IA ✍️</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                  Nossos algoritmos escrevem com base nas melhores estruturas de copywriting. Para obter o máximo desempenho:
                </p>
                <ul className="space-y-3 text-xs text-white/80">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-[#06B6D4] font-bold shrink-0 mt-0.5">1</span>
                    <span><strong>Seja Específico:</strong> Em vez de "dicas de marketing", use "3 estratégias de tráfego pago para e-commerce de moda".</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-[#06B6D4] font-bold shrink-0 mt-0.5">2</span>
                    <span><strong>Defina o Público:</strong> Indique no prompt quem deve ler (ex: "voltado para iniciantes", "focado em empresários").</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-[#06B6D4] font-bold shrink-0 mt-0.5">3</span>
                    <span><strong>Use a Caixa de Ajuste:</strong> Se o primeiro resultado não for perfeito, use o chat inferior no criador para pedir alterações específicas (ex: "deixe o tom mais agressivo", "adicione uma chamada para ação no final").</span>
                  </li>
                </ul>
              </div>
            )}

            {activeHelpModal === 'export' && (
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <Download className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-2">Exportação Perfeita 📥</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                  Garantimos a máxima nitidez para suas publicações no Instagram:
                </p>
                <ul className="space-y-3 text-xs text-white/80">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-emerald-400 font-bold shrink-0 mt-0.5">1</span>
                    <span><strong>Download Compactado:</strong> Ao exportar, geramos todas as telas individualmente em alta definição em formato PNG, compactadas em um arquivo ZIP.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-emerald-400 font-bold shrink-0 mt-0.5">2</span>
                    <span><strong>Postagem sem Perda:</strong> Certifique-se de ativar a opção "Carregar em alta qualidade" nas configurações de mídia do seu aplicativo do Instagram para evitar compressão forçada da plataforma.</span>
                  </li>
                </ul>
              </div>
            )}

            <button
              onClick={() => setActiveHelpModal(null)}
              className="mt-6 w-full btn-primary py-2.5 rounded-xl text-xs font-bold transition-all animate-bounce duration-[2000ms]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
