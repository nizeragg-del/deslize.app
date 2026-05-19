'use client'

import { useState, useEffect, useRef } from 'react'
import { Sparkles, Palette, Type, MessageSquare, Upload, Save, Plus, Trash2, Check, Lock, RefreshCw, Crown } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function BrandKitPage() {
  const supabase = createClient()
  
  const [profile, setProfile] = useState<any>(null)
  const [brands, setBrands] = useState<any[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  
  // Active editing form state
  const [brandForm, setBrandForm] = useState({
    name: '',
    tagline: '',
    tone: 'Profissional',
    primaryColor: '#7C3AED',
    secondaryColor: '#06B6D4',
    bgColor: '#0A0A0F',
    fontDisplay: 'Outfit',
    fontBody: 'Inter',
    logoUrl: '',
    isDefault: false
  })

  // Load all user profiles and brands
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Load profile to check plan
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileData) {
          setProfile(profileData)
        }

        // 2. Load brands
        const { data: brandsData } = await supabase
          .from('brands')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })

        if (brandsData && brandsData.length > 0) {
          setBrands(brandsData)
          
          // Select default brand first, or the first one in the list
          const defaultBrand = brandsData.find(b => b.is_default) || brandsData[0]
          setSelectedBrandId(defaultBrand.id)
          
          setBrandForm({
            name: defaultBrand.name,
            tagline: defaultBrand.tagline || '',
            tone: defaultBrand.tone || 'Profissional',
            primaryColor: defaultBrand.primary_color,
            secondaryColor: defaultBrand.secondary_color,
            bgColor: defaultBrand.bg_color,
            fontDisplay: defaultBrand.font_display,
            fontBody: defaultBrand.font_body,
            logoUrl: defaultBrand.logo_url || '',
            isDefault: defaultBrand.is_default || false
          })
        } else {
          // If no brands exist, initialize with a default template state
          setBrandForm({
            name: 'Minha Marca',
            tagline: 'Slogan da minha marca',
            tone: 'Profissional',
            primaryColor: '#7C3AED',
            secondaryColor: '#06B6D4',
            bgColor: '#0A0A0F',
            fontDisplay: 'Outfit',
            fontBody: 'Inter',
            logoUrl: '',
            isDefault: true
          })
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Handle switching selected brand
  const handleSelectBrand = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId)
    if (!brand) return
    
    setSelectedBrandId(brandId)
    setBrandForm({
      name: brand.name,
      tagline: brand.tagline || '',
      tone: brand.tone || 'Profissional',
      primaryColor: brand.primary_color,
      secondaryColor: brand.secondary_color,
      bgColor: brand.bg_color,
      fontDisplay: brand.font_display,
      fontBody: brand.font_body,
      logoUrl: brand.logo_url || '',
      isDefault: brand.is_default || false
    })
  }

  // Get current brand limit from subscription plan
  const getBrandLimit = () => {
    if (!profile) return 1
    const plan = profile.plan?.toLowerCase()
    if (plan === 'pro') return 3
    if (plan === 'agency' || plan === 'agência') return 10
    return 1 // free / starter
  }

  const brandLimit = getBrandLimit()
  const isLimitReached = brands.length >= brandLimit

  // Create a new brand profile
  const handleCreateBrand = async () => {
    if (isLimitReached) {
      alert(`Seu plano atual (${profile?.plan || 'Grátis'}) permite criar no máximo ${brandLimit} perfil(is) de marca. Faça o upgrade para adicionar mais marcas!`)
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newBrandName = `Nova Marca ${brands.length + 1}`
      
      const { data: newBrand, error } = await supabase
        .from('brands')
        .insert({
          user_id: user.id,
          name: newBrandName,
          primary_color: '#7C3AED',
          secondary_color: '#06B6D4',
          bg_color: '#0A0A0F',
          font_display: 'Outfit',
          font_body: 'Inter',
          tagline: 'Seu Slogan',
          tone: 'Profissional',
          is_default: brands.length === 0
        })
        .select('*')
        .single()

      if (error) throw error

      if (newBrand) {
        const updatedBrands = [...brands, newBrand]
        setBrands(updatedBrands)
        setSelectedBrandId(newBrand.id)
        setBrandForm({
          name: newBrand.name,
          tagline: newBrand.tagline || '',
          tone: newBrand.tone || 'Profissional',
          primaryColor: newBrand.primary_color,
          secondaryColor: newBrand.secondary_color,
          bgColor: newBrand.bg_color,
          fontDisplay: newBrand.font_display,
          fontBody: newBrand.font_body,
          logoUrl: newBrand.logo_url || '',
          isDefault: newBrand.is_default || false
        })
      }
    } catch (err: any) {
      console.error(err)
      alert('Erro ao criar marca: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Delete current brand
  const handleDeleteBrand = async () => {
    if (!selectedBrandId) return
    if (brands.length <= 1) {
      alert('Você deve manter pelo menos uma marca configurada.')
      return
    }

    if (!confirm('Tem certeza que deseja excluir esta marca? Essa ação não pode ser desfeita.')) {
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', selectedBrandId)

      if (error) throw error

      const updatedBrands = brands.filter(b => b.id !== selectedBrandId)
      setBrands(updatedBrands)
      
      // Select the first remaining brand
      const nextBrand = updatedBrands[0]
      setSelectedBrandId(nextBrand.id)
      setBrandForm({
        name: nextBrand.name,
        tagline: nextBrand.tagline || '',
        tone: nextBrand.tone || 'Profissional',
        primaryColor: nextBrand.primary_color,
        secondaryColor: nextBrand.secondary_color,
        bgColor: nextBrand.bg_color,
        fontDisplay: nextBrand.font_display,
        fontBody: nextBrand.font_body,
        logoUrl: nextBrand.logo_url || '',
        isDefault: nextBrand.is_default || false
      })
    } catch (err: any) {
      console.error(err)
      alert('Erro ao deletar marca: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Handle Logo Upload to Supabase Storage
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${selectedBrandId || 'temp'}_${Date.now()}.${fileExt}`
      const filePath = `${user.id}/brand_logos/${fileName}`

      // Upload file to slide bucket (the only bucket with storage policies configured)
      const { error: uploadError } = await supabase.storage
        .from('slides')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Fetch public URL
      const { data: { publicUrl } } = supabase.storage
        .from('slides')
        .getPublicUrl(filePath)

      setBrandForm(prev => ({ ...prev, logoUrl: publicUrl }))
    } catch (err: any) {
      console.error(err)
      alert('Erro ao enviar logo: ' + err.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  // Save changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // If set as default, clear other default brands first
      if (brandForm.isDefault) {
        await supabase
          .from('brands')
          .update({ is_default: false })
          .eq('user_id', user.id)
      }

      const brandPayload = {
        name: brandForm.name,
        tagline: brandForm.tagline,
        tone: brandForm.tone,
        primary_color: brandForm.primaryColor,
        secondary_color: brandForm.secondaryColor,
        bg_color: brandForm.bgColor,
        font_display: brandForm.fontDisplay,
        font_body: brandForm.fontBody,
        logo_url: brandForm.logoUrl,
        is_default: brandForm.isDefault
      }

      let error
      if (selectedBrandId) {
        // Update existing brand
        const { error: updateError } = await supabase
          .from('brands')
          .update(brandPayload)
          .eq('id', selectedBrandId)
        error = updateError
      } else {
        // Insert new brand
        const { error: insertError } = await supabase
          .from('brands')
          .insert({
            ...brandPayload,
            user_id: user.id
          })
        error = insertError
      }

      if (error) throw error

      // Refresh brands list
      const { data: brandsData } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (brandsData) {
        setBrands(brandsData)
        // Keep active selection or set default if brand created
        if (!selectedBrandId && brandsData.length > 0) {
          const latestBrand = brandsData[brandsData.length - 1]
          setSelectedBrandId(latestBrand.id)
        }
      }

      alert('Brand Kit salvo com sucesso!')
    } catch (err: any) {
      console.error(err)
      alert('Erro ao salvar marca: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--accent)]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header & Subtext */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-2">
            Brand Kit
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Configure a identidade visual da sua marca. A IA usará essas regras para gerar seus carrosséis de forma consistente.
          </p>
        </div>

        {/* Subscription Plan details */}
        {profile && (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-right">
            <div className="flex items-center gap-1.5 justify-end text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
              <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              Plano {profile.plan === 'free' ? 'Gratuito' : profile.plan}
            </div>
            <div className="text-xs text-white">
              Marcas utilizadas: <span className="font-bold">{brands.length} / {brandLimit}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR: Brand list selector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Suas Marcas</h3>
              {isLimitReached && (
                <span className="text-[9px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Max
                </span>
              )}
            </div>

            <div className="space-y-2">
              {brands.map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleSelectBrand(b.id)}
                  className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                    selectedBrandId === b.id
                      ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)] text-white'
                      : 'bg-black/20 border-[var(--border-dark)] text-[var(--text-muted)] hover:border-white/20'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                      {b.name}
                      {b.is_default && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Padrão"></span>
                      )}
                    </div>
                    <div className="text-[9px] text-[var(--text-muted2)] truncate mt-0.5">{b.tagline || 'Sem slogan'}</div>
                  </div>
                  
                  {/* Colors dot previews */}
                  <div className="flex gap-1 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: b.primary_color }}></div>
                    <div className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: b.secondary_color }}></div>
                  </div>
                </div>
              ))}

              {brands.length === 0 && (
                <div className="text-center py-6 text-xs text-[var(--text-muted2)]">
                  Nenhuma marca criada.
                </div>
              )}
            </div>

            {/* Create brand kit button */}
            <button
              onClick={handleCreateBrand}
              className={`w-full py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isLimitReached
                  ? 'bg-white/5 border-dashed border-white/10 text-[var(--text-muted2)] cursor-not-allowed'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 cursor-pointer'
              }`}
            >
              <Plus className="w-4 h-4" />
              Adicionar Marca
            </button>

            {isLimitReached && (
              <p className="text-[10px] text-center text-yellow-400/80 leading-normal mt-2">
                Quer gerenciar mais perfis de marcas? Faça o upgrade do seu plano.
              </p>
            )}
          </div>
        </div>

        {/* MAIN PANEL: Active Form Editing */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Identidade Básica */}
            <section className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-dark)] pb-4">
                <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-semibold text-white">
                  Identidade da Marca
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Nome da Marca / @</label>
                  <input 
                    type="text" 
                    value={brandForm.name}
                    onChange={e => setBrandForm({...brandForm, name: e.target.value})}
                    placeholder="Ex: @suamarca"
                    className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white placeholder:text-[var(--text-muted2)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Slogan / Subtítulo</label>
                  <input 
                    type="text" 
                    value={brandForm.tagline}
                    onChange={e => setBrandForm({...brandForm, tagline: e.target.value})}
                    placeholder="Ex: Criando conteúdos virais"
                    className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white placeholder:text-[var(--text-muted2)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-[var(--text-muted)]">Logotipo da Marca</label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 border border-dashed border-[var(--border-dark)] rounded-xl bg-[#ffffff02] hover:bg-[#ffffff05] transition-colors relative">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-tr from-[var(--brand-primary)] to-[var(--accent)] p-[1px] flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                        {brandForm.logoUrl ? (
                          <img src={brandForm.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-extrabold text-lg">
                            {brandForm.name ? brandForm.name.substring(0, 2).toUpperCase() : 'SM'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        {uploadingLogo ? (
                          <><RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--brand-primary)]" /> Enviando...</>
                        ) : (
                          <><Upload className="w-3.5 h-3.5" /> Enviar arquivo de imagem</>
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted2)] leading-relaxed">
                        PNG transparente ou SVG recomendado. Limite de 2MB. O arquivo será salvo com segurança.
                      </div>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  {brandForm.logoUrl && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={brandForm.logoUrl}
                        readOnly
                        className="flex-1 bg-black/40 border border-[var(--border-dark)] rounded-lg px-3 py-1.5 text-[10px] text-[var(--text-muted)] font-mono truncate"
                      />
                      <button
                        type="button"
                        onClick={() => setBrandForm(prev => ({ ...prev, logoUrl: '' }))}
                        className="text-[10px] text-red-400 hover:text-red-300 font-medium px-2 py-1.5 rounded bg-red-400/5 hover:bg-red-400/10 border border-red-400/10 transition-all shrink-0"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Cores */}
            <section className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-dark)] pb-4">
                <Palette className="w-5 h-5 text-[var(--brand-primary)]" />
                <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-semibold text-white">
                  Paleta de Cores da Marca
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Cor Primária</label>
                  <div className="flex gap-3">
                    <input 
                      type="color" 
                      value={brandForm.primaryColor}
                      onChange={e => setBrandForm({...brandForm, primaryColor: e.target.value})}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={brandForm.primaryColor}
                      onChange={e => setBrandForm({...brandForm, primaryColor: e.target.value})}
                      className="flex-1 bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-2 text-white font-mono text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Cor Secundária</label>
                  <div className="flex gap-3">
                    <input 
                      type="color" 
                      value={brandForm.secondaryColor}
                      onChange={e => setBrandForm({...brandForm, secondaryColor: e.target.value})}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={brandForm.secondaryColor}
                      onChange={e => setBrandForm({...brandForm, secondaryColor: e.target.value})}
                      className="flex-1 bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-2 text-white font-mono text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Cor de Fundo</label>
                  <div className="flex gap-3">
                    <input 
                      type="color" 
                      value={brandForm.bgColor}
                      onChange={e => setBrandForm({...brandForm, bgColor: e.target.value})}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={brandForm.bgColor}
                      onChange={e => setBrandForm({...brandForm, bgColor: e.target.value})}
                      className="flex-1 bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-2 text-white font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Tipografia */}
            <section className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-dark)] pb-4">
                <Type className="w-5 h-5 text-[var(--accent)]" />
                <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-semibold text-white">
                  Tipografia Recomendada
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Fonte para Títulos</label>
                  <select 
                    value={brandForm.fontDisplay}
                    onChange={e => setBrandForm({...brandForm, fontDisplay: e.target.value})}
                    className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--brand-primary)] select-field text-sm"
                  >
                    <option value="Outfit">Outfit</option>
                    <option value="Space Grotesk">Space Grotesk</option>
                    <option value="Syne">Syne</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Playfair Display">Playfair Display</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Fonte para Corpo de Texto</label>
                  <select 
                    value={brandForm.fontBody}
                    onChange={e => setBrandForm({...brandForm, fontBody: e.target.value})}
                    className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--brand-primary)] select-field text-sm"
                  >
                    <option value="Inter">Inter</option>
                    <option value="DM Sans">DM Sans</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                    <option value="Lora">Lora</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Comunicação */}
            <section className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-dark)] pb-4">
                <MessageSquare className="w-5 h-5 text-[var(--brand-primary)]" />
                <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-semibold text-white">
                  Comunicação e Tom de Voz
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-[var(--text-muted)]">Como a IA deve redigir os textos da marca?</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {['Profissional', 'Educativo', 'Descontraído', 'Urgente', 'Motivacional'].map((tone) => (
                    <div 
                      key={tone}
                      onClick={() => setBrandForm({...brandForm, tone})}
                      className={`p-3 text-center rounded-xl cursor-pointer transition-all border text-xs font-semibold ${
                        brandForm.tone === tone 
                          ? 'bg-[var(--brand-primary)]/20 border-[var(--brand-primary)] text-white' 
                          : 'bg-[#00000033] border-[var(--border-dark)] text-[var(--text-muted)] hover:border-white/30'
                      }`}
                    >
                      {tone}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Opções e Configuração Padrão */}
            <section className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={brandForm.isDefault}
                  onChange={e => setBrandForm({ ...brandForm, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--border-dark)] bg-black/40 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] cursor-pointer"
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-white cursor-pointer select-none">
                  Definir este Brand Kit como padrão para novas criações de carrossel
                </label>
              </div>
            </section>

            {/* Action buttons (Save / Delete) */}
            <div className="flex justify-between items-center pt-4">
              <div>
                {brands.length > 1 && (
                  <button 
                    type="button" 
                    onClick={handleDeleteBrand}
                    disabled={saving}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-5 py-3 rounded-xl border border-red-500/20 hover:border-red-500/30 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir Marca
                  </button>
                )}
              </div>

              <button 
                type="submit" 
                disabled={saving || uploadingLogo}
                className="btn-primary flex items-center gap-2 font-bold px-6 py-3 cursor-pointer shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] disabled:opacity-50"
              >
                {saving ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /> Salvando...</>
                ) : (
                  <><Save className="w-5 h-5" /> Salvar Alterações</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
