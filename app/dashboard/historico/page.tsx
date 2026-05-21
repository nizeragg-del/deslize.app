'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Plus, Eye, Download, Trash2, Calendar, Layout, X, RefreshCw, Star, Folder, FolderPlus, FolderOpen, Tag } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import DOMPurify from 'isomorphic-dompurify'
import JSZip from 'jszip'

export default function CarouselHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [carousels, setCarousels] = useState<any[]>([])
  const [selectedCarousel, setSelectedCarousel] = useState<any | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [exportLoading, setExportLoading] = useState(false)
  const supabase = createClient()

  // Folders & Favorites states
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all')
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [customFolders, setCustomFolders] = useState<string[]>(['Geral', 'Campanhas', 'Dicas', 'Lançamentos'])

  // Drag state for interactive slider preview inside modal
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadCarousels()
  }, [])

  // Helper functions for folders & favorites
  async function toggleFavorite(carouselId: string, currentStatus: boolean, e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    const newStatus = !currentStatus
    try {
      const { error } = await supabase
        .from('carousels')
        .update({ is_favorite: newStatus })
        .eq('id', carouselId)
      
      if (!error) {
        setCarousels((prev: any[]) => prev.map(c => c.id === carouselId ? { ...c, is_favorite: newStatus } : c))
        if (selectedCarousel && selectedCarousel.id === carouselId) {
          setSelectedCarousel((prev: any) => prev ? { ...prev, is_favorite: newStatus } : null)
        }
      }
    } catch (err) {
      console.error('Erro ao favoritar carrossel:', err)
    }
  }

  async function updateFolder(carouselId: string, folderName: string | null) {
    try {
      const { error } = await supabase
        .from('carousels')
        .update({ folder_name: folderName })
        .eq('id', carouselId)
      
      if (!error) {
        setCarousels((prev: any[]) => prev.map(c => c.id === carouselId ? { ...c, folder_name: folderName } : c))
        if (selectedCarousel && selectedCarousel.id === carouselId) {
          setSelectedCarousel((prev: any) => prev ? { ...prev, folder_name: folderName } : null)
        }
        setEditingFolderId(null)
      }
    } catch (err) {
      console.error('Erro ao atualizar pasta:', err)
    }
  }

  const dynamicFolders = Array.from(new Set([
    ...customFolders,
    ...carousels.map(c => c.folder_name).filter(Boolean)
  ])) as string[]


  async function loadCarousels() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('carousels')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setCarousels(data)
      }
    } catch (err) {
      console.error('Erro ao carregar carrosséis:', err)
    } finally {
      setLoading(false)
    }
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
        setCarousels((prev: any[]) => prev.filter(c => c.id !== id))
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
          html: carousel.html_content,
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

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const filteredCarousels = carousels.filter(carousel => {
    const matchesTab = activeTab === 'all' || carousel.is_favorite
    const matchesFolder = selectedFolder === 'all' || carousel.folder_name === selectedFolder
    return matchesTab && matchesFolder
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-1">
            Meus <span className="text-gradient">Carrosséis</span>
          </h1>
          <p className="text-[var(--text-muted)]">Veja seu histórico de criações e exporte-os a qualquer momento.</p>
        </div>
        <Link 
          href="/dashboard/novo" 
          className="btn-primary inline-flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Criar Novo Carrossel
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--accent)]"></div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar de Pastas */}
          <div className="w-full lg:w-64 shrink-0 space-y-6">
            <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-5 space-y-4 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-[var(--border-dark)] pb-3">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  <Folder className="w-4 h-4 text-[var(--accent)]" />
                  Pastas
                </h3>
              </div>
              
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedFolder('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                    selectedFolder === 'all' 
                      ? 'bg-[var(--brand-primary)]/15 text-white border border-[var(--brand-primary)]/20 font-semibold' 
                      : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="w-3.5 h-3.5" />
                    Todas as Pastas
                  </span>
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full font-mono">{carousels.length}</span>
                </button>

                {dynamicFolders.map(folder => {
                  const count = carousels.filter(c => c.folder_name === folder).length
                  return (
                    <button
                      key={folder}
                      onClick={() => setSelectedFolder(folder)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                        selectedFolder === folder 
                          ? 'bg-[var(--brand-primary)]/15 text-white border border-[var(--brand-primary)]/20 font-semibold' 
                          : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Folder className="w-3.5 h-3.5 shrink-0 text-white/40" />
                        {folder}
                      </span>
                      <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full font-mono">{count}</span>
                    </button>
                  )
                })}
              </div>

              {/* Criador de Pasta rápido */}
              <div className="pt-3 border-t border-[var(--border-dark)] space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nova pasta..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="flex-1 bg-black/40 border border-[var(--border-dark)] rounded-xl px-3 py-1.5 text-[11px] text-white placeholder-[var(--text-muted2)] focus:outline-none focus:border-[var(--brand-primary)]/50"
                  />
                  <button
                    onClick={() => {
                      if (newFolderName.trim() && !customFolders.includes(newFolderName.trim())) {
                        setCustomFolders(prev => [...prev, newFolderName.trim()])
                        setSelectedFolder(newFolderName.trim())
                        setNewFolderName('')
                      }
                    }}
                    className="p-2 bg-[var(--brand-primary)]/10 text-[var(--accent)] hover:bg-[var(--brand-primary)]/20 rounded-xl transition-all border border-[var(--brand-primary)]/20 flex items-center justify-center shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Área de Filtros e Grid */}
          <div className="flex-1 space-y-6">
            {/* Tabs for All vs Favorites */}
            <div className="flex items-center justify-between border-b border-[var(--border-dark)] pb-4">
              <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-[var(--border-dark)]">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'all'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'favorites'
                      ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20'
                      : 'text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  Favoritos
                </button>
              </div>

              <div className="text-xs text-[var(--text-muted)] font-mono">
                {filteredCarousels.length} item(ns) encontrado(s)
              </div>
            </div>

            {filteredCarousels.length === 0 ? (
              <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-16 text-center">
                <Layout className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-bold text-white mb-2">Sem resultados</h3>
                <p className="text-[var(--text-muted)] mb-8 max-w-sm mx-auto text-xs">Não encontramos nenhum carrossel com os filtros ativos. Mude seus filtros ou crie um novo!</p>
                <Link href="/dashboard/novo" className="btn-primary inline-flex items-center gap-2 py-2 text-xs">
                  <Plus className="w-4 h-4" />
                  Criar novo carrossel
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {filteredCarousels.map((carousel) => (
                  <div 
                    key={carousel.id} 
                    onClick={() => {
                      setSelectedCarousel(carousel)
                      setCurrentSlide(0)
                    }}
                    className="group bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl overflow-hidden hover:border-[var(--brand-primary)]/50 transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
                  >
                    {/* Favorite Button (Absolute Overlay) */}
                    <button
                      onClick={(e) => toggleFavorite(carousel.id, carousel.is_favorite, e)}
                      className={`absolute top-4 left-4 p-2 rounded-xl backdrop-blur-md border transition-all z-10 ${
                        carousel.is_favorite 
                          ? 'bg-amber-500/20 border-amber-500/30 text-amber-400 shadow-lg' 
                          : 'bg-black/60 border-white/10 text-white/60 hover:text-white hover:bg-black/80'
                      }`}
                      title={carousel.is_favorite ? "Remover dos favoritos" : "Favoritar"}
                    >
                      <Star className={`w-3.5 h-3.5 ${carousel.is_favorite ? 'fill-current' : ''}`} />
                    </button>

                    {/* Cover Thumbnail Stack - Real Live HTML Slide Preview */}
                    <div className="aspect-[4/5] bg-gradient-to-br from-[#ffffff05] to-[#ffffff0a] relative flex items-center justify-center border-b border-[var(--border-dark)] overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise-pattern-with-subtle-cross-lines.png')] opacity-10"></div>
                      
                      {/* Live Preview Container */}
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                        <div className="w-[400px] h-[500px] shrink-0 origin-center scale-[0.55] sm:scale-[0.6] md:scale-[0.55] lg:scale-[0.58] xl:scale-[0.65] rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative" style={{ backgroundColor: '#07070D' }}>
                          <style dangerouslySetInnerHTML={{__html: `
                            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Share+Tech+Mono&family=Playfair+Display:ital,wght@0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Outfit:wght@700;800&family=Inter:wght@300;400;500;600&display=swap');
                            .preview-track-thumb { display: flex; height: 100%; width: 100%; }
                            .ig-slide { width: 100%; min-width: 100%; flex-shrink: 0; height: 100%; padding: 40px; padding-top: 85px; position: relative; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
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
                            dangerouslySetInnerHTML={{ __html: carousel.html_content ? DOMPurify.sanitize(carousel.html_content, { FORCE_BODY: true, ADD_TAGS: ['style', 'link'], ADD_ATTR: ['href', 'rel', 'type'] }) : '' }}
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
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Pronto
                            </span>
                            <span className="text-[10px] text-[var(--text-muted2)] uppercase tracking-wider">{carousel.format || 'Carrossel'}</span>
                          </div>

                          {/* Folder Popover Select */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingFolderId(editingFolderId === carousel.id ? null : carousel.id)
                              }}
                              className="px-2 py-0.5 text-[10px] text-[var(--text-muted)] hover:text-white bg-white/5 border border-white/5 rounded-md hover:bg-white/10 transition-all flex items-center gap-1 shrink-0"
                              title="Adicionar à pasta"
                            >
                              <Folder className="w-3 h-3 text-[var(--accent)]" />
                              <span className="max-w-[80px] truncate">{carousel.folder_name || 'Sem Pasta'}</span>
                            </button>

                            {editingFolderId === carousel.id && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute bottom-6 right-0 bg-[#0d0d12]/95 border border-[var(--border-dark)] backdrop-blur-md rounded-xl p-1.5 w-44 z-20 shadow-2xl space-y-0.5 animate-in fade-in slide-in-from-bottom-1 duration-200"
                              >
                                <div className="text-[9px] font-bold text-[var(--text-muted2)] px-2 py-1 uppercase tracking-wider border-b border-white/5 mb-1">
                                  Mover para pasta
                                </div>
                                <button
                                  onClick={() => updateFolder(carousel.id, null)}
                                  className={`w-full text-left px-2 py-1 rounded-lg text-[11px] hover:bg-white/5 transition-all truncate flex items-center gap-1.5 ${!carousel.folder_name ? 'text-[var(--accent)] font-semibold bg-white/5' : 'text-white'}`}
                                >
                                  <X className="w-2.5 h-2.5 text-white/40" />
                                  Sem Pasta
                                </button>
                                {dynamicFolders.map(folder => (
                                  <button
                                    key={folder}
                                    onClick={() => updateFolder(carousel.id, folder)}
                                    className={`w-full text-left px-2 py-1 rounded-lg text-[11px] hover:bg-white/5 transition-all truncate flex items-center gap-1.5 ${carousel.folder_name === folder ? 'text-[var(--accent)] font-semibold bg-white/5' : 'text-white'}`}
                                  >
                                    <Folder className="w-2.5 h-2.5 text-white/40" />
                                    {folder}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <h3 className="font-bold text-white mb-1 group-hover:text-[var(--accent)] transition-colors truncate">
                          {carousel.title}
                        </h3>
                      </div>
                      
                      <div className="mt-6 pt-3 border-t border-[var(--border-dark)] flex items-center justify-between">
                        <span className="text-[10px] text-[var(--text-muted)] inline-flex items-center gap-1">
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
        </div>
      )}

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
                      .ig-slide { width: 100%; min-width: 100%; flex-shrink: 0; height: 100%; padding: 40px; padding-top: 85px; position: relative; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
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
                      dangerouslySetInnerHTML={{ __html: selectedCarousel?.html_content ? DOMPurify.sanitize(selectedCarousel.html_content, { FORCE_BODY: true, ADD_TAGS: ['style', 'link'], ADD_ATTR: ['href', 'rel', 'type'] }) : '' }}
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
    </div>
  )
}
