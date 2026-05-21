'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, ArrowRight, Layout, Type, Palette, Download, RefreshCw, Lock, Zap, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import DOMPurify from 'isomorphic-dompurify'
import JSZip from 'jszip'

const TOTAL_SLIDES = 7

export default function NewCarouselPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [topic, setTopic] = useState('')
  const [format, setFormat] = useState('Listicle')
  const [tone, setTone] = useState('Educativo')
  const [visualTheme, setVisualTheme] = useState('Mínimo Moderno')
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [carouselId, setCarouselId] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  
  // Profile state for dynamic credits & plans
  const [profile, setProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false)

  // New UI/UX states (Melhorias 4, 5, 12, 13)
  const [loadingStage, setLoadingStage] = useState(0)
  const [slideHeadings, setSlideHeadings] = useState<string[]>([])
  const [hoveredDot, setHoveredDot] = useState<number | null>(null)
  const [isGridModalOpen, setIsGridModalOpen] = useState(false)
  const [copiedCaption, setCopiedCaption] = useState(false)
  
  const startXRef = useRef(0)
  const viewportRef = useRef<HTMLDivElement>(null)
  const viewportWidthRef = useRef(0)

  const refreshProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (data) {
          setProfile(data)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('profile-updated'))
          }
        }
      }
    } catch (err) {
      console.error('Error refreshing profile:', err)
    }
  };

  // Brands list state
  const [brands, setBrands] = useState<any[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string>('default')

  useEffect(() => {
    async function loadInitialData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // 1. Load Profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          if (profileData) {
            setProfile(profileData)
          }

          // 2. Load Brands
          const { data: brandsData } = await supabase
            .from('brands')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
          if (brandsData) {
            setBrands(brandsData)
            const defaultBrand = brandsData.find(b => b.is_default) || brandsData[0]
            if (defaultBrand) {
              setSelectedBrandId(defaultBrand.id)
            }
          }
        }
      } catch (err) {
        console.error('Error loading initial data:', err)
      } finally {
        setProfileLoading(false)
      }
    }
    loadInitialData()
  }, [])

  // 1. Loading Stages Timer (Melhoria 5)
  useEffect(() => {
    let interval: any
    if (loading) {
      setLoadingStage(0)
      interval = setInterval(() => {
        setLoadingStage(prev => (prev + 1) % 4)
      }, 3000)
    } else {
      setLoadingStage(0)
    }
    return () => clearInterval(interval)
  }, [loading])

  // 2. Parse slide headings from dynamic HTML content (Melhoria 4)
  useEffect(() => {
    if (htmlContent) {
      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(htmlContent, 'text/html')
        const headings = Array.from(doc.querySelectorAll('.slide-h')).map(el => el.textContent || '')
        setSlideHeadings(headings)
      } catch (err) {
        console.error('Error parsing headings:', err)
      }
    } else {
      setSlideHeadings([])
    }
  }, [htmlContent])

  // 3. Helper to extract cover slide HTML (Melhoria 12)
  const getCoverSlideHtml = () => {
    if (!htmlContent) return ''
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlContent, 'text/html')
      const firstSlide = doc.querySelector('.ig-slide')
      return firstSlide ? firstSlide.outerHTML : ''
    } catch (err) {
      console.error(err)
      return ''
    }
  }

  // 4. Helper to copy post caption/legend (Melhoria 13)
  const handleCopyCaption = () => {
    const text = `🔥 Quer aprender mais sobre "${topic || 'este tema'}"?
     
Aqui está o resumo do que você precisa saber:
${slideHeadings.slice(1, 6).map((h, i) => `${i + 1}️⃣ ${h}`).join('\n')}

💡 Salve esse post para não esquecer e siga @suamarca para mais dicas diárias de alto impacto!

#instagrammarketing #conteudodigital #branding #sucesso #copywriting`
    
    navigator.clipboard.writeText(text)
    setCopiedCaption(true)
    setTimeout(() => setCopiedCaption(false), 3000)
  }

  const handleStart = (clientX: number) => {
    if (!htmlContent) return
    setIsDragging(true)
    startXRef.current = clientX
    if (viewportRef.current) {
      viewportWidthRef.current = viewportRef.current.clientWidth
    }
  }

  const handleMove = (clientX: number) => {
    if (!isDragging) return
    const diff = clientX - startXRef.current
    
    // Resistance at boundaries
    if (currentSlide === 0 && diff > 0) {
      setDragOffset(diff * 0.3)
    } else if (currentSlide === TOTAL_SLIDES - 1 && diff < 0) {
      setDragOffset(diff * 0.3)
    } else {
      setDragOffset(diff)
    }
  }

  const handleEnd = (clientX?: number) => {
    if (!isDragging) return
    setIsDragging(false)
    
    const dragDistance = dragOffset
    const threshold = viewportWidthRef.current * 0.15
    
    if (Math.abs(dragDistance) < 5 && clientX !== undefined && viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect()
      const clickX = clientX - rect.left
      if (clickX < rect.width / 2) {
        setCurrentSlide(prev => Math.max(0, prev - 1))
      } else {
        setCurrentSlide(prev => Math.min(TOTAL_SLIDES - 1, prev + 1))
      }
    } else {
      if (dragDistance < -threshold && currentSlide < TOTAL_SLIDES - 1) {
        setCurrentSlide(prev => prev + 1)
      } else if (dragDistance > threshold && currentSlide > 0) {
        setCurrentSlide(prev => prev - 1)
      }
    }
    setDragOffset(0)
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic) return
    
    setLoading(true)
    setHtmlContent(null)

    // Lookup active brand kit
    const activeBrand = brands.find(b => b.id === selectedBrandId)

    try {
      const res = await fetch('/api/carousel/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          format,
          tone,
          visualTheme,
          slideCount: 7,
          brand: activeBrand ? {
            name: activeBrand.name,
            primaryColor: activeBrand.primary_color,
            secondaryColor: activeBrand.secondary_color,
            bgColor: activeBrand.bg_color,
            fontDisplay: activeBrand.font_display,
            fontBody: activeBrand.font_body,
            tagline: activeBrand.tagline,
            tone: activeBrand.tone
          } : {
            name: 'suamarca',
            primaryColor: '#7C3AED',
            secondaryColor: '#06B6D4'
          }
        })
      })

      const data = await res.json()
      if (data.success) {
        setHtmlContent(data.html)
        setCarouselId(data.carouselId)
        setCurrentSlide(0)
        refreshProfile() // Update credits in UI after generation!
      } else {
        alert(data.error || 'Erro ao gerar carrossel')
      }
    } catch (err) {
      console.error(err)
      alert('Erro de conexão ao gerar carrossel')
    } finally {
      setLoading(false)
    }
  }

  const handleAdjust = async (instruction: string) => {
    if (!htmlContent || !instruction) return

    setLoading(true)
    
    // Lookup active brand kit
    const activeBrand = brands.find(b => b.id === selectedBrandId)

    try {
      const res = await fetch('/api/carousel/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentHtml: htmlContent,
          instruction,
          visualTheme,
          brand: activeBrand ? {
            name: activeBrand.name,
            primaryColor: activeBrand.primary_color,
            secondaryColor: activeBrand.secondary_color,
            bgColor: activeBrand.bg_color,
            fontDisplay: activeBrand.font_display,
            fontBody: activeBrand.font_body,
            tagline: activeBrand.tagline,
            tone: activeBrand.tone
          } : {
            name: 'suamarca',
            primaryColor: '#7C3AED',
            secondaryColor: '#06B6D4'
          }
        })
      })

      const data = await res.json()
      if (data.success) {
        setHtmlContent(data.html)
      } else {
        alert(data.error || 'Erro ao ajustar carrossel')
      }
    } catch (err) {
      console.error(err)
      alert('Erro de conexão ao ajustar carrossel')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!htmlContent) return

    // INTERCEPT: If plan is free, show the beautiful premium modal instead of calling export
    if (!profile || profile.plan === 'free') {
      setIsUpsellModalOpen(true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/carousel/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          html: htmlContent,
          slideCount: 7,
          carouselId: carouselId || 'temp_id'
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
        const filename = `${(topic || 'carrossel').trim().replace(/\s+/g, '_')}.zip`
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
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto min-h-[calc(100vh-8rem)] h-auto lg:h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      
      {/* Editor Panel */}
      <div className={`w-full lg:w-1/3 flex flex-col gap-6 h-auto lg:h-full pr-2 pb-8 relative ${
        profile && profile.credits <= 0 && !profileLoading ? 'overflow-hidden' : 'overflow-visible lg:overflow-y-auto'
      }`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-1">
              Novo Carrossel
            </h1>
            <p className="text-xs text-[var(--text-muted)]">Configure os detalhes e deixe a IA fazer a mágica.</p>
          </div>
          {profile && (
            <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-right shrink-0">
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                Plano {profile.plan === 'free' ? 'Gratuito' : profile.plan.toUpperCase()}
              </div>
              <div className="text-xs font-bold text-white font-mono">
                {profile.credits} {profile.credits === 1 ? 'créd.' : 'créd.'}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Tema do carrossel</label>
              <textarea 
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Ex: 5 erros que impedem você de crescer no Instagram"
                className="w-full bg-black/20 border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white placeholder:text-[var(--text-muted2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:border-transparent transition-all resize-none h-24"
                required
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2 text-[var(--text-muted)]">
                <Layout className="w-4 h-4" /> Formato
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Padrão', 'Listicle', 'Tutorial', 'Comparação'].map(f => (
                  <div 
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`px-3 py-2 text-center text-sm rounded-lg cursor-pointer transition-colors border ${
                      format === f 
                        ? 'bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-white' 
                        : 'bg-black/20 border-[var(--border-dark)] text-[var(--text-muted)] hover:border-white/30'
                    }`}
                  >
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2 text-[var(--text-muted)]">
                <Type className="w-4 h-4" /> Tom de voz
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Profissional', 'Educativo', 'Motivacional', 'Urgente'].map(t => (
                  <div 
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-3 py-2 text-center text-sm rounded-lg cursor-pointer transition-colors border ${
                      tone === t 
                        ? 'bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-white' 
                        : 'bg-[#00000033] border-[var(--border-dark)] text-[var(--text-muted)] hover:border-white/30'
                    }`}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2 text-[var(--text-muted)]">
                <Palette className="w-4 h-4" /> Estilo Visual
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Mínimo Moderno', 'Neon Tech', 'Editorial Elegante'].map(style => (
                  <div 
                    key={style}
                    onClick={() => setVisualTheme(style)}
                    className={`px-2 py-2 text-center text-[10px] rounded-lg cursor-pointer transition-colors border leading-tight flex items-center justify-center min-h-[38px] ${
                      visualTheme === style 
                        ? 'bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-white font-semibold' 
                        : 'bg-[#00000033] border-[var(--border-dark)] text-[var(--text-muted)] hover:border-white/30'
                    }`}
                  >
                    {style}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2 text-[var(--text-muted)]">
                <Palette className="w-4 h-4" /> Brand Kit
              </label>
              <select 
                value={selectedBrandId}
                onChange={e => {
                  const val = e.target.value
                  setSelectedBrandId(val)
                  const activeBrand = brands.find(b => b.id === val)
                  if (activeBrand && activeBrand.tone) {
                    setTone(activeBrand.tone)
                  }
                }}
                className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
              >
                {brands.map(b => (
                  <option key={b.id} value={b.id} className="bg-[#111116] text-white">
                    {b.name} {b.is_default ? '(Padrão)' : ''}
                  </option>
                ))}
                {brands.length === 0 && (
                  <option value="default" className="bg-[#111116] text-white">@suamarca (Padrão)</option>
                )}
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !topic}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> Gerando carrossel...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Gerar com IA</>
            )}
          </button>
        </form>

        {/* Credits Blocker Overlay (Upsell 2) */}
        {profile && profile.credits <= 0 && !profileLoading && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-20 border border-white/5 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/30 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-[var(--brand-primary)] animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Créditos Esgotados</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-[240px] mb-6">
              {profile.plan === 'free' 
                ? 'Você atingiu o limite de gerações gratuitas. Faça o upgrade agora para adicionar mais créditos recorrentes!' 
                : 'Você utilizou todos os seus créditos deste mês. Faça o upgrade ou compre créditos para continuar gerando carrosséis!'
              }
            </p>
            <button
              onClick={() => window.location.href = '/dashboard/planos'}
              className="btn-primary py-3 px-6 text-sm font-bold flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] transition-all"
            >
              <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" /> Ver Planos & Créditos
            </button>
          </div>
        )}

        {/* Action Panel for adjustments (only visible when generated) */}
        {htmlContent && (
          <>
            <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-5 mt-4">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--accent)]" /> Ajuste por IA
              </h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ex: Deixa o slide 2 mais urgente"
                  className="flex-1 bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[var(--text-muted2)] focus:outline-none focus:border-[var(--brand-primary)]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdjust(e.currentTarget.value)
                  }}
                />
                <button 
                  onClick={() => handleAdjust('Ajuste via botão')}
                  className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/80 text-white p-2 rounded-xl transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 mt-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-primary)]/10 rounded-full blur-3xl pointer-events-none"></div>
              <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                <Type className="w-4 h-4 text-[var(--brand-primary)]" /> Legenda Sugerida
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-4 line-clamp-2">
                🔥 Quer aprender mais sobre "{topic || 'este tema'}"?
                Aqui está o resumo do que você precisa saber...
              </p>
              <button
                onClick={handleCopyCaption}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl transition-all border border-white/5"
              >
                {copiedCaption ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Type className="w-4 h-4" />}
                {copiedCaption ? 'Legenda Copiada!' : 'Copiar Legenda'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Preview Panel */}
      <div className="w-full lg:w-2/3 min-h-[600px] lg:h-full lg:min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            {htmlContent ? 'Preview interativo' : 'Aguardando configuração'}
          </div>
          {htmlContent && (
            <div className="flex gap-2">
              <button 
                onClick={() => setIsGridModalOpen(true)}
                disabled={loading}
                className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 border border-white/10"
              >
                <Layout className="w-4 h-4" />
                Ver no Grid
              </button>
              <button 
                onClick={handleExport}
                disabled={loading}
                className="flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Exportar PNGs
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 bg-[#050508] border border-[var(--border-dark)] rounded-3xl relative flex items-center justify-center overflow-hidden">
          {/* subtle background noise */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise-pattern-with-subtle-cross-lines.png')] opacity-10 pointer-events-none"></div>
          
          {!htmlContent && !loading && (
            <div className="text-center p-8 relative z-10 max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Layout className="w-8 h-8 text-[var(--text-muted2)]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Preview Sandbox</h3>
              <p className="text-[var(--text-muted)] text-sm">Seu carrossel será gerado e renderizado aqui com as cores da sua marca.</p>
            </div>
          )}

          {loading && (
            <div className="text-center relative z-10 flex flex-col items-center max-w-sm p-6 w-full animate-in fade-in duration-300">
              {/* Spinning and pulsing loader */}
              <div className="w-16 h-16 relative mb-6">
                <div className="absolute inset-0 border-4 border-[var(--brand-primary)]/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[var(--accent)] rounded-full border-t-transparent animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-[var(--brand-primary)] animate-pulse" />
              </div>
              
              <h3 className="text-xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-2">A IA está criando...</h3>
              <p className="text-[var(--text-muted)] text-xs mb-6 animate-pulse text-center">Aguarde, estruturando sua publicação viral.</p>
              
              {/* Dynamic steps indicating exact pipeline stages (Melhoria 5) */}
              <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-left space-y-3">
                {[
                  'Escrevendo copy magnética com engenharia de prompts...',
                  'Harmonizando paleta de cores do Brand Kit...',
                  'Diagramando tipografia e ajustando contraste...',
                  'Finalizando e compilando slides em alta definição...'
                ].map((stepMsg, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="shrink-0">
                      {loadingStage > idx ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                        </div>
                      ) : loadingStage === idx ? (
                        <div className="w-4 h-4 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/30 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-ping"></div>
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-white/5 border border-white/10"></div>
                      )}
                    </div>
                    <span className={`text-[10px] ${loadingStage === idx ? 'text-white font-bold' : loadingStage > idx ? 'text-white/40' : 'text-white/20'}`}>
                      {stepMsg}
                    </span>
                  </div>
                ))}
              </div>

              {/* Skeleton screen visual placeholders */}
              <div className="w-full mt-6 h-12 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white/5 animate-pulse shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-2 bg-white/10 rounded w-3/4 animate-pulse"></div>
                  <div className="h-1.5 bg-white/5 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          {htmlContent && !loading && (
            <div className="w-full h-full p-4 md:p-8 flex items-center justify-center relative z-10 overflow-hidden">
              {/* Instagram Frame */}
              <div className="w-full max-w-[400px] lg:max-w-[calc(80vh-340px)] bg-surface-dark rounded-xl overflow-hidden relative shadow-2xl border border-white/10 flex flex-col">
                {/* Header mock */}
                <div className="flex items-center gap-3 p-3 border-b border-white/10 shrink-0 bg-surface-dark">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                    <div className="w-full h-full rounded-full bg-black border border-black flex items-center justify-center text-[10px] font-bold text-white">SM</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">suamarca</div>
                    <div className="text-[10px] text-gray-400 leading-tight">suamarca.com.br</div>
                  </div>
                </div>

                {/* Slider Viewport Container */}
                <div style={{ position: 'relative' }}>
                  {/* Slider Viewport */}
                  <div 
                    className="relative overflow-hidden bg-bg-dark"
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
                    {/* We inject the global CSS styles needed for the slide formatting here */}
                    <style dangerouslySetInnerHTML={{__html: `
                      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Share+Tech+Mono&family=Playfair+Display:ital,wght@0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Outfit:wght@700;800&family=Inter:wght@300;400;500;600&display=swap');
                      .preview-track { display: flex; height: 100%; }
                      .ig-slide { width: 100%; min-width: 100%; flex-shrink: 0; height: 100%; padding: 40px; position: relative; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
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
                      dangerouslySetInnerHTML={{ __html: htmlContent ? DOMPurify.sanitize(htmlContent, { FORCE_BODY: true, ADD_TAGS: ['style', 'link'], ADD_ATTR: ['href', 'rel', 'type'] }) : '' }}
                    ></div>
                  </div>

                  {/* Persistent Progress Bar Overlay */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10 flex items-center gap-3"
                  >
                    <div className="flex-1 h-[3px] bg-white/25 rounded overflow-hidden">
                      <div 
                        className="h-full bg-white rounded transition-all duration-300"
                        style={{ width: `${((currentSlide + 1) / TOTAL_SLIDES) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-[11px] font-bold text-white/80 font-mono">{currentSlide + 1}/{TOTAL_SLIDES}</div>
                  </div>
                </div>

                {/* IG Action Buttons */}
                <div className="flex justify-between items-center p-3 border-t border-white/10 bg-[#0d0d12] text-white">
                  <div className="flex gap-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:text-red-500 transition-colors">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:text-blue-400 transition-colors">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:text-green-400 transition-colors">
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </div>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:text-yellow-400 transition-colors">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>

                {/* IG Caption */}
                <div className="px-4 pb-3 text-xs text-white bg-[#0d0d12] text-left">
                  <span className="font-bold mr-2">suamarca</span>
                  <span className="text-gray-300">{topic || "Como economizar tempo criando conteúdo..."}</span>
                  <div className="mt-1 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">AGORA</div>
                </div>

                {/* IG Dots Navigation */}
                <div className="flex justify-center gap-1.5 pb-4 bg-[#0d0d12] relative">
                  {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
                    <div 
                      key={i} 
                      onClick={() => setCurrentSlide(i)}
                      onMouseEnter={() => setHoveredDot(i)}
                      onMouseLeave={() => setHoveredDot(null)}
                      className={`w-[6px] h-[6px] rounded-full transition-all cursor-pointer relative ${
                        currentSlide === i ? 'bg-[#7c3aed]' : 'bg-white/20 hover:bg-white/40'
                      }`}
                    >
                      {hoveredDot === i && slideHeadings[i] && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none animate-in fade-in slide-in-from-bottom-1">
                          {slideHeadings[i].length > 20 ? slideHeadings[i].substring(0, 20) + '...' : slideHeadings[i]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upsell 1 Premium Export Modal */}
      {isUpsellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-in fade-in duration-300">
          <div className="bg-[#07070D] border border-white/10 rounded-3xl p-8 max-w-md w-full relative overflow-hidden shadow-[0_0_50px_rgba(124,58,237,0.25)] flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            {/* Background Glows */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--brand-primary)]/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Glowing Icon Header */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[var(--brand-primary)] to-cyan-500 p-[1px] shadow-[0_0_20px_rgba(124,58,237,0.3)] mb-6">
              <div className="w-full h-full bg-[#07070D] rounded-2xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />
              </div>
            </div>

            <h3 className="text-2xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-2">
              Exportação Premium 🚀
            </h3>
            
            <p className="text-sm text-[var(--text-muted)] mb-6">
              Seu carrossel está pronto e maravilhoso! Mude para o plano <span className="text-white font-semibold">Starter</span> para exportar em alta definição e publicar no seu Instagram.
            </p>

            {/* Benefit checklist */}
            <div className="w-full space-y-3 bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs text-white/90 font-medium">Exportação PNG sem limites de downloads</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs text-white/90 font-medium">Mais de 30 créditos recorrentes todo mês</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs text-white/90 font-medium">Estilos visuais exclusivos e Brand Kits extras</span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => {
                  setIsUpsellModalOpen(false)
                  window.location.href = '/dashboard/planos?plan=starter'
                }}
                className="w-full btn-primary py-4 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all"
              >
                Desbloquear Exportações por R$ 29/mês <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsUpsellModalOpen(false)}
                className="w-full py-3 text-xs text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
              >
                Voltar para o editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed Grid Modal */}
      {isGridModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-in fade-in duration-300">
          <div className="bg-[#07070D] border border-white/10 rounded-3xl p-6 max-w-sm w-full relative overflow-hidden shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300">
            <div className="w-full flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layout className="w-5 h-5 text-[var(--brand-primary)]" /> Preview no Feed
              </h3>
              <button onClick={() => setIsGridModalOpen(false)} className="text-[var(--text-muted)] hover:text-white transition-colors">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 w-full bg-black/50 p-1 border border-white/5 rounded-xl">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-white/5 rounded-md flex items-center justify-center">
                  <div className="w-6 h-6 rounded bg-white/10"></div>
                </div>
              ))}
              <div className="aspect-square rounded-md overflow-hidden relative border border-[var(--brand-primary)]/50 shadow-[0_0_15px_rgba(124,58,237,0.3)] bg-[var(--bg-dark)]">
                <div className="w-[300%] h-[300%] origin-top-left scale-[0.333]" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getCoverSlideHtml(), { FORCE_BODY: true, ADD_TAGS: ['style', 'link'], ADD_ATTR: ['href', 'rel', 'type'] }) }}></div>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-4 text-center">
              Veja como seu carrossel vai se destacar no perfil.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
