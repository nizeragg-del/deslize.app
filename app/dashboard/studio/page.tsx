'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import JSZip from 'jszip'
import {
  ArrowUp,
  ChevronDown,
  Download,
  Hand,
  Image,
  LayoutGrid,
  Loader2,
  MousePointer2,
  Palette,
  Play,
  Share2,
  Sparkles,
  SquareDashedMousePointer,
  Wand2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { snapshotCarouselTrack } from '@/lib/carousel-export'

const TOTAL_SLIDES = 7
const SLIDE_W = 220
const SLIDE_H = 275
const GAP = 34

const splitSlides = (html: string) => {
  if (typeof window === 'undefined' || !html) return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return Array.from(doc.querySelectorAll('.ig-slide')).map((slide) => slide.outerHTML)
}

type Brand = {
  id: string
  name: string
  primary_color: string
  secondary_color: string
  bg_color: string
  font_display: string
  font_body: string
  tagline?: string
  tone?: string
  logo_url?: string
  niche?: string
  target_audience?: string
  main_offer?: string
  audience_pains?: string
  content_goal?: string
  is_default?: boolean
}

type SlideNode = {
  id: string
  index: number
  x: number
  y: number
  html?: string
  imageUrl?: string
}

type SelectionBox = {
  active: boolean
  startX: number
  startY: number
  x: number
  y: number
  width: number
  height: number
}

export default function CarouselStudioPage() {
  const supabase = createClient()
  const canvasRef = useRef<HTMLDivElement>(null)
  const exportTrackRef = useRef<HTMLDivElement>(null)
  const panRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 })
  const dragRef = useRef({ id: '', startX: 0, startY: 0, originX: 0, originY: 0 })
  const selectionRef = useRef({ active: false, startX: 0, startY: 0 })

  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState('default')
  const [viewport, setViewport] = useState({ x: 180, y: 140, zoom: 0.72 })
  const [tool, setTool] = useState<'select' | 'pan'>('pan')
  const [prompt, setPrompt] = useState('')
  const [topic, setTopic] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [slideUrls, setSlideUrls] = useState<string[]>([])
  const [nodes, setNodes] = useState<SlideNode[]>([])
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState('Pronto para criar')

  const activeBrand = useMemo(
    () => brands.find((brand) => brand.id === selectedBrandId),
    [brands, selectedBrandId]
  )

  const selectedNodes = useMemo(
    () =>
      selectedNodeIds
        .map((id) => nodes.find((node) => node.id === id))
        .filter(Boolean) as SlideNode[],
    [nodes, selectedNodeIds]
  )

  const selectionLabel = useMemo(() => {
    if (selectedNodes.length === 0) return ''
    const ordered = [...selectedNodes].sort((a, b) => a.index - b.index)
    if (ordered.length === 1) return `Slide ${ordered[0].index + 1}`
    return `${ordered.length} slides selecionados: ${ordered.map((node) => node.index + 1).join(', ')}`
  }, [selectedNodes])

  useEffect(() => {
    async function loadBrands() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (data) {
        setBrands(data)
        const defaultBrand = data.find((brand) => brand.is_default) || data[0]
        if (defaultBrand) setSelectedBrandId(defaultBrand.id)
      }
    }

    loadBrands()
  }, [])

  const worldPoint = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    return {
      x: (clientX - (rect?.left || 0) - viewport.x) / viewport.zoom,
      y: (clientY - (rect?.top || 0) - viewport.y) / viewport.zoom,
    }
  }

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const oldZoom = viewport.zoom
    const nextZoom = Math.min(1.8, Math.max(0.25, oldZoom * (event.deltaY > 0 ? 0.92 : 1.08)))
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    const worldX = (mouseX - viewport.x) / oldZoom
    const worldY = (mouseY - viewport.y) / oldZoom

    setViewport({
      x: mouseX - worldX * nextZoom,
      y: mouseY - worldY * nextZoom,
      zoom: nextZoom,
    })
  }

  const startPan = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || tool !== 'pan') return
    panRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const movePan = (event: React.PointerEvent<HTMLElement>) => {
    if (!panRef.current.active) return
    setViewport((current) => ({
      ...current,
      x: panRef.current.originX + event.clientX - panRef.current.startX,
      y: panRef.current.originY + event.clientY - panRef.current.startY,
    }))
  }

  const stopPan = () => {
    panRef.current.active = false
  }

  const startCanvasSelection = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || tool !== 'select') return
    const point = worldPoint(event.clientX, event.clientY)
    selectionRef.current = { active: true, startX: point.x, startY: point.y }
    setSelectionBox({ active: true, startX: point.x, startY: point.y, x: point.x, y: point.y, width: 0, height: 0 })
    setSelectedNodeIds([])
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveCanvasSelection = (event: React.PointerEvent<HTMLElement>) => {
    if (!selectionRef.current.active) return
    const point = worldPoint(event.clientX, event.clientY)
    const x = Math.min(selectionRef.current.startX, point.x)
    const y = Math.min(selectionRef.current.startY, point.y)
    const width = Math.abs(point.x - selectionRef.current.startX)
    const height = Math.abs(point.y - selectionRef.current.startY)

    setSelectionBox({ active: true, startX: selectionRef.current.startX, startY: selectionRef.current.startY, x, y, width, height })

    const selected = nodes
      .filter((node) => {
        const nodeRight = node.x + SLIDE_W
        const nodeBottom = node.y + SLIDE_H + 34
        return node.x < x + width && nodeRight > x && node.y < y + height && nodeBottom > y
      })
      .map((node) => node.id)

    setSelectedNodeIds(selected)
  }

  const stopCanvasSelection = () => {
    selectionRef.current.active = false
    setSelectionBox(null)
  }

  const startNodeDrag = (event: React.PointerEvent<HTMLDivElement>, node: SlideNode) => {
    if (tool !== 'select') return
    event.stopPropagation()
    setSelectedNodeIds((current) => {
      if (event.shiftKey) {
        return current.includes(node.id) ? current.filter((id) => id !== node.id) : [...current, node.id]
      }
      return current.includes(node.id) ? current : [node.id]
    })
    const point = worldPoint(event.clientX, event.clientY)
    dragRef.current = {
      id: node.id,
      startX: point.x,
      startY: point.y,
      originX: node.x,
      originY: node.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveNode = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.id) return
    const point = worldPoint(event.clientX, event.clientY)
    const dx = point.x - dragRef.current.startX
    const dy = point.y - dragRef.current.startY
    setNodes((current) =>
      current.map((node) =>
        node.id === dragRef.current.id
          ? { ...node, x: dragRef.current.originX + dx, y: dragRef.current.originY + dy }
          : node
      )
    )
  }

  const stopNodeDrag = () => {
    dragRef.current.id = ''
  }

  const zoomBy = (delta: number) => {
    setViewport((current) => ({
      ...current,
      zoom: Math.min(1.8, Math.max(0.25, current.zoom + delta)),
    }))
  }

  const fitView = () => {
    setViewport({ x: 180, y: 150, zoom: 0.72 })
  }

  const generateNodes = (html: string, urls: string[]) => {
    const slides = splitSlides(html)
    const created = Array.from({ length: Math.max(slides.length, urls.length, TOTAL_SLIDES) }).map((_, index) => ({
      id: `slide-${index + 1}`,
      index,
      x: index * (SLIDE_W + GAP),
      y: 0,
      html: slides[index],
      imageUrl: urls[index],
    }))
    setNodes(created)
    setSelectedNodeIds(created[0]?.id ? [created[0].id] : [])
  }

  const buildBrandPayload = () =>
    activeBrand
      ? {
          name: activeBrand.name,
          primaryColor: activeBrand.primary_color,
          secondaryColor: activeBrand.secondary_color,
          bgColor: activeBrand.bg_color,
          fontDisplay: activeBrand.font_display,
          fontBody: activeBrand.font_body,
          tagline: activeBrand.tagline,
          tone: activeBrand.tone,
          logoUrl: activeBrand.logo_url,
          niche: activeBrand.niche,
          targetAudience: activeBrand.target_audience,
          mainOffer: activeBrand.main_offer,
          audiencePains: activeBrand.audience_pains,
          contentGoal: activeBrand.content_goal,
        }
      : {
          name: 'suamarca',
          primaryColor: '#7C3AED',
          secondaryColor: '#06B6D4',
        }

  const instructionWithSelection = (text: string) => {
    if (!selectedNodes.length) return text
    const ordered = [...selectedNodes].sort((a, b) => a.index - b.index)
    const slideText = ordered.length === 1 ? `slide ${ordered[0].index + 1}` : `slides ${ordered.map((node) => node.index + 1).join(', ')}`
    return `Aplique esta instruÃ§Ã£o apenas no(s) ${slideText}: ${text}`
  }

  const handleGenerate = async () => {
    const cleanPrompt = prompt.trim()
    if (!cleanPrompt || generating) return

    if (htmlContent && selectedNodes.length > 0) {
      await handleModify(cleanPrompt)
      return
    }

    setGenerating(true)
    setStatus('Gerando carrossel na lousa...')
    setTopic(cleanPrompt)

    try {
      const res = await fetch('/api/carousel/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: cleanPrompt,
          format: 'Listicle',
          tone: activeBrand?.tone || 'Educativo',
          visualTheme: 'DireÃ§Ã£o Autoral',
          slideCount: TOTAL_SLIDES,
          brand: buildBrandPayload(),
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar carrossel')
      }

      setHtmlContent(data.html || '')
      const urls = Array.isArray(data.slideUrls) ? data.slideUrls : []
      setSlideUrls(urls)
      generateNodes(data.html || '', urls)
      setPrompt('')
      setStatus('Carrossel gerado. Arraste os slides ou peÃ§a alteraÃ§Ãµes.')
      fitView()
    } catch (err: any) {
      console.error(err)
      setStatus(err.message || 'Erro ao gerar')
      alert(err.message || 'Erro ao gerar carrossel')
    } finally {
      setGenerating(false)
    }
  }

  const handleModify = async (instruction: string) => {
    if (!htmlContent || generating) return

    setGenerating(true)
    setStatus(`Alterando ${selectionLabel || 'carrossel'}...`)

    try {
      const res = await fetch('/api/carousel/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentHtml: htmlContent,
          instruction: instructionWithSelection(instruction),
          visualTheme: 'DireÃ§Ã£o Autoral',
          brand: buildBrandPayload(),
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao ajustar carrossel')
      }

      setHtmlContent(data.html || '')
      setSlideUrls([])
      generateNodes(data.html || '', [])
      setPrompt('')
      setStatus(`${selectionLabel || 'Carrossel'} ajustado.`)
    } catch (err: any) {
      console.error(err)
      setStatus(err.message || 'Erro ao ajustar')
      alert(err.message || 'Erro ao ajustar carrossel')
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = async (mode: 'all' | 'selected' = 'all') => {
    if (!htmlContent && slideUrls.length === 0) return
    const selectedIndexes = [...selectedNodes].map((node) => node.index).sort((a, b) => a - b)
    const exportSelected = mode === 'selected' && selectedIndexes.length > 0
    setExportMenuOpen(false)
    setStatus(exportSelected ? `Exportando ${selectedIndexes.length} slide(s)...` : 'Preparando exportacao...')

    try {
      const zip = new JSZip()
      let urls = slideUrls

      if (urls.length === 0) {
        const exportHtml = snapshotCarouselTrack(exportTrackRef.current) || htmlContent
        const res = await fetch('/api/carousel/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            html: exportHtml,
            slideCount: TOTAL_SLIDES,
            carouselId: 'studio_export',
          }),
        })
        const data = await res.json()
        urls = Array.isArray(data.urls) ? data.urls : []
      }

      const urlsToExport = exportSelected
        ? selectedIndexes.map((index) => ({ url: urls[index], index })).filter((item) => Boolean(item.url))
        : urls.map((url, index) => ({ url, index }))

      await Promise.all(
        urlsToExport.map(async ({ url, index }) => {
          const imgRes = await fetch(url)
          zip.file(`slide_${index + 1}.png`, await imgRes.blob())
        })
      )

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const downloadUrl = URL.createObjectURL(zipBlob)
      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = `${(topic || 'carrossel-studio').trim().replace(/\s+/g, '_')}.zip`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(downloadUrl)
      setStatus('ExportaÃ§Ã£o pronta.')
    } catch (err: any) {
      console.error(err)
      setStatus(err.message || 'Erro ao exportar')
    }
  }

  return (
    <div className="fixed inset-0 lg:left-64 bg-[#09090b] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18)_1.2px,transparent_1.4px)] bg-[length:28px_28px] opacity-35"></div>

      <header className="absolute left-5 right-5 top-5 z-30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button className="h-11 w-11 rounded-full border border-white/10 bg-[#131316]/90 text-white flex items-center justify-center">
            <LayoutGrid className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-sm font-bold">Carousel Studio</h1>
            <p className="text-[11px] text-[var(--text-muted)]">{status}</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-[#131316]/90 px-3 py-2 shadow-2xl">
          <button
            onClick={() => setTool('select')}
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${tool === 'select' ? 'bg-white text-black' : 'text-white/80 hover:bg-white/10'}`}
          >
            <MousePointer2 className="h-4 w-4" /> Selecionar
          </button>
          <button
            onClick={() => setTool('pan')}
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${tool === 'pan' ? 'bg-white text-black' : 'text-white/80 hover:bg-white/10'}`}
          >
            <Hand className="h-4 w-4" /> Navegar
          </button>
          <div className="h-6 w-px bg-white/10"></div>
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate
          </button>
          <button className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10">
            <Wand2 className="h-4 w-4" /> Modify
          </button>
          <button className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10">
            <Play className="h-4 w-4" /> Preview
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <button
              onClick={() => setExportMenuOpen((open) => !open)}
              disabled={!htmlContent && slideUrls.length === 0}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-[#131316]/90 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-40"
            >
              <Download className="h-4 w-4" /> Exportar <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#131316] p-1 shadow-2xl">
                <button
                  onClick={() => handleExport('all')}
                  className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-white hover:bg-white/10"
                >
                  Exportar todos os slides
                </button>
                <button
                  onClick={() => handleExport('selected')}
                  disabled={selectedNodes.length === 0}
                  className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Exportar selecionados ({selectedNodes.length})
                </button>
              </div>
            )}
          </div>
          <button className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-[#131316]/90 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10">
            <Share2 className="h-4 w-4" /> Compartilhar
          </button>
        </div>
      </header>

      <aside className="absolute right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-white/10 bg-[#131316]/90 p-2 md:flex">
        <button className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80">
          <MousePointer2 className="h-4 w-4" />
        </button>
        <button className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80">
          <SquareDashedMousePointer className="h-4 w-4" />
        </button>
        <button className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80">
          <Image className="h-4 w-4" />
        </button>
        <button className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80">
          <Palette className="h-4 w-4" />
        </button>
      </aside>

      <main
        ref={canvasRef}
        className={`absolute inset-0 z-10 overflow-hidden ${tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        onWheel={handleWheel}
        onPointerDown={(event) => {
          startPan(event)
          startCanvasSelection(event)
        }}
        onPointerMove={(event) => {
          movePan(event)
          moveCanvasSelection(event)
        }}
        onPointerUp={() => {
          stopPan()
          stopCanvasSelection()
        }}
        onPointerCancel={() => {
          stopPan()
          stopCanvasSelection()
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}
        >
          {nodes.length === 0 && (
            <div className="absolute left-0 top-0 w-[540px] rounded-3xl border border-white/10 bg-[#151518]/85 p-8 shadow-2xl backdrop-blur">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/20 text-[var(--accent)]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">Crie carrossÃ©is em uma lousa visual</h2>
              <p className="max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
                Escreva um pedido no chat abaixo. O Studio vai gerar os slides como cards arrastÃ¡veis para vocÃª reorganizar, navegar e exportar.
              </p>
            </div>
          )}

          {selectionBox && (
            <div
              className="pointer-events-none absolute border border-[var(--accent)]/80 bg-[var(--accent)]/10"
              style={{
                left: selectionBox.x,
                top: selectionBox.y,
                width: selectionBox.width,
                height: selectionBox.height,
              }}
            />
          )}

          {nodes.map((node) => (
            <div
              key={node.id}
              onPointerDown={(event) => startNodeDrag(event, node)}
              onPointerMove={moveNode}
              onPointerUp={stopNodeDrag}
              onPointerCancel={stopNodeDrag}
              className={`absolute rounded-2xl border bg-[#111115] shadow-2xl transition-shadow ${selectedNodeIds.includes(node.id) ? 'border-[var(--brand-primary)] shadow-[0_0_28px_rgba(124,58,237,0.35)]' : 'border-white/10'}`}
              style={{ left: node.x, top: node.y, width: SLIDE_W }}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[11px] text-white/70">
                <span className="font-bold">Slide {node.index + 1}</span>
                <span>{Math.round(viewport.zoom * 100)}%</span>
              </div>
              <div className="overflow-hidden rounded-b-2xl bg-black" style={{ width: SLIDE_W, height: SLIDE_H }}>
                {node.imageUrl ? (
                  <img src={node.imageUrl} alt={`Slide ${node.index + 1}`} className="h-full w-full object-cover" draggable={false} />
                ) : node.html ? (
                  <div className="h-full w-full origin-top-left scale-[0.2037]">
                    <style dangerouslySetInnerHTML={{ __html: previewStyles }} />
                    <div
                      className="h-[1350px] w-[1080px]"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(node.html, {
                          FORCE_BODY: true,
                          ADD_TAGS: ['style', 'link'],
                          ADD_ATTR: ['href', 'rel', 'type'],
                        }),
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">Aguardando</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <div className="absolute bottom-5 right-5 z-30 flex items-center gap-2 rounded-full border border-white/10 bg-[#131316]/90 px-3 py-2">
        <button onClick={() => zoomBy(-0.1)} className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center">
          <ZoomOut className="h-4 w-4" />
        </button>
        <button onClick={fitView} className="min-w-14 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
          {Math.round(viewport.zoom * 100)}%
        </button>
        <button onClick={() => zoomBy(0.1)} className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center">
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      <section className="absolute bottom-5 left-1/2 z-30 w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl border border-[var(--brand-primary)]/40 bg-[#151518]/95 p-4 shadow-[0_0_45px_rgba(124,58,237,0.22)] backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            {selectionLabel || 'Carousel Studio'}
          </div>
          <select
            value={selectedBrandId}
            onChange={(event) => setSelectedBrandId(event.target.value)}
            className="min-w-0 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs text-white focus:outline-none"
          >
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id} className="bg-[#111116]">
                {brand.name} {brand.is_default ? '(PadrÃ£o)' : ''}
              </option>
            ))}
            {brands.length === 0 && (
              <option value="default" className="bg-[#111116]">
                @suamarca
              </option>
            )}
          </select>
        </div>
        <div className="flex items-end gap-3">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) handleGenerate()
            }}
            placeholder="O que vocÃª quer criar ou mudar?"
            className="max-h-32 min-h-14 flex-1 resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-[var(--text-muted2)] focus:border-[var(--brand-primary)] focus:outline-none"
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generating}
            className="h-12 w-12 rounded-2xl bg-[var(--brand-primary)] text-white flex items-center justify-center shadow-[0_0_24px_rgba(124,58,237,0.45)] disabled:opacity-50"
            aria-label="Gerar"
          >
            {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
          </button>
        </div>
      </section>

      <div className="pointer-events-none fixed -left-[9999px] top-0 h-[1350px] w-[1080px] overflow-hidden">
        <style dangerouslySetInnerHTML={{ __html: previewStyles }} />
        <div
          ref={exportTrackRef}
          className="preview-track flex h-full"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(htmlContent, {
              FORCE_BODY: true,
              ADD_TAGS: ['style', 'link'],
              ADD_ATTR: ['href', 'rel', 'type'],
            }),
          }}
        />
      </div>
    </div>
  )
}

const previewStyles = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Share+Tech+Mono&family=Playfair+Display:ital,wght@0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Outfit:wght@700;800&family=Inter:wght@300;400;500;600&display=swap');
.preview-track { display: flex; height: 100%; }
.ig-slide { width: 1080px; min-width: 1080px; height: 1350px; padding: 120px; padding-top: 190px; padding-bottom: 190px; position: relative; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
.slide-tag { position: absolute; top: 90px; left: 90px; font-size: 28px; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: 5px; }
.slide-logo { position: absolute; top: 88px; right: 90px; display: flex; align-items: center; gap: 18px; }
.slide-logo-dot { width: 36px; height: 36px; border-radius: 50%; }
.slide-logo-text { font-size: 32px; font-weight: 700; letter-spacing: -0.5px; }
.slide-logo-img { display: block; width: auto; height: 56px; max-width: 220px; object-fit: contain; object-position: center; }
.slide-num-bg { position: absolute; bottom: 0; right: 0; font-family: inherit; font-size: 520px; font-weight: 800; color: rgba(255,255,255,0.03); line-height: 0.8; }
.slide-h { font-family: inherit; font-weight: 800; line-height: 1.1; margin-bottom: 56px; position: relative; z-index: 10; font-size: 78px; }
.slide-body { font-size: 38px; color: rgba(255,255,255,0.7); line-height: 1.6; max-width: 90%; position: relative; z-index: 10; }
.slide-progress { position: absolute; bottom: 90px; left: 90px; right: 90px; display: flex; align-items: center; gap: 34px; }
.progress-track { flex: 1; height: 10px; background: rgba(255,255,255,0.1); border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; background: white; border-radius: 999px; }
.progress-label { font-size: 28px; font-weight: 600; color: rgba(255,255,255,0.5); }
`

