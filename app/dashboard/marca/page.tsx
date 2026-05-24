'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, Palette, Plus, Save, Sparkles, Trash2, Type, Upload } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

const presets = [
  { name: 'Cyber', primary: '#a855f7', secondary: '#22d3ee', bg: '#09090b' },
  { name: 'Emerald', primary: '#34d399', secondary: '#2dd4bf', bg: '#071713' },
  { name: 'Editorial', primary: '#f8fafc', secondary: '#94a3b8', bg: '#101113' },
  { name: 'Ruby', primary: '#fb7185', secondary: '#f97316', bg: '#180b10' },
]

const colorFields = [
  { label: 'Primária', key: 'primaryColor' as const },
  { label: 'Secundária', key: 'secondaryColor' as const },
  { label: 'Fundo', key: 'bgColor' as const },
]

const emptyBrand = {
  name: 'Minha Marca',
  tagline: '',
  tone: 'Profissional',
  primaryColor: '#a855f7',
  secondaryColor: '#22d3ee',
  bgColor: '#09090b',
  fontDisplay: 'Outfit',
  fontBody: 'Inter',
  logoUrl: '',
  niche: '',
  targetAudience: '',
  mainOffer: '',
  audiencePains: '',
  contentGoal: '',
  isDefault: true,
}

export default function BrandKitPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [brands, setBrands] = useState<any[]>([])
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyBrand)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      const { data: brandData } = await supabase.from('brands').select('*').eq('user_id', user.id).order('created_at', { ascending: true })

      setProfile(profileData)
      setBrands(brandData || [])

      const active = brandData?.find((brand) => brand.is_default) || brandData?.[0]
      if (active) {
        setSelectedBrandId(active.id)
        fillForm(active)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  function fillForm(brand: any) {
    setForm({
      name: brand.name || '',
      tagline: brand.tagline || '',
      tone: brand.tone || 'Profissional',
      primaryColor: brand.primary_color || '#a855f7',
      secondaryColor: brand.secondary_color || '#22d3ee',
      bgColor: brand.bg_color || '#09090b',
      fontDisplay: brand.font_display || 'Outfit',
      fontBody: brand.font_body || 'Inter',
      logoUrl: brand.logo_url || '',
      niche: brand.niche || '',
      targetAudience: brand.target_audience || '',
      mainOffer: brand.main_offer || '',
      audiencePains: brand.audience_pains || '',
      contentGoal: brand.content_goal || '',
      isDefault: Boolean(brand.is_default),
    })
  }

  function selectBrand(brand: any) {
    setSelectedBrandId(brand.id)
    fillForm(brand)
  }

  async function createBrand() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('brands')
      .insert({
        user_id: user.id,
        name: `Nova Marca ${brands.length + 1}`,
        primary_color: '#a855f7',
        secondary_color: '#22d3ee',
        bg_color: '#09090b',
        font_display: 'Outfit',
        font_body: 'Inter',
        tone: 'Profissional',
        is_default: brands.length === 0,
      })
      .select('*')
      .single()

    if (data) {
      setBrands((current) => [...current, data])
      selectBrand(data)
    }
  }

  async function uploadLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setUploading(false)
      return
    }

    const ext = file.name.split('.').pop()
    const path = `${user.id}/brand_logos/${selectedBrandId || 'brand'}_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('slides').upload(path, file, { upsert: true })

    if (!error) {
      const { data } = supabase.storage.from('slides').getPublicUrl(path)
      setForm((current) => ({ ...current, logoUrl: data.publicUrl }))
    }
    setUploading(false)
  }

  async function saveBrand(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    if (form.isDefault) {
      await supabase.from('brands').update({ is_default: false }).eq('user_id', user.id)
    }

    const payload = {
      user_id: user.id,
      name: form.name,
      tagline: form.tagline,
      tone: form.tone,
      primary_color: form.primaryColor,
      secondary_color: form.secondaryColor,
      bg_color: form.bgColor,
      font_display: form.fontDisplay,
      font_body: form.fontBody,
      logo_url: form.logoUrl,
      niche: form.niche,
      target_audience: form.targetAudience,
      main_offer: form.mainOffer,
      audience_pains: form.audiencePains,
      content_goal: form.contentGoal,
      is_default: form.isDefault,
    }

    if (selectedBrandId) {
      await supabase.from('brands').update(payload).eq('id', selectedBrandId)
    } else {
      const { data } = await supabase.from('brands').insert(payload).select('*').single()
      if (data) setSelectedBrandId(data.id)
    }

    const { data: brandData } = await supabase.from('brands').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
    setBrands(brandData || [])
    setSaving(false)
    setSaved(true)
  }

  async function deleteBrand() {
    if (!selectedBrandId || brands.length <= 1 || !confirm('Excluir este Brand Kit?')) return
    await supabase.from('brands').delete().eq('id', selectedBrandId)
    const next = brands.filter((brand) => brand.id !== selectedBrandId)
    setBrands(next)
    if (next[0]) selectBrand(next[0])
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
      </div>
    )
  }

  const limit = profile?.plan === 'agency' ? 10 : profile?.plan === 'pro' ? 3 : 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-cyan-300">Identidade</p>
          <h1 className="mt-2 text-4xl font-bold">Brand Kit</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">Defina marca, tom, paleta e contexto para o Studio gerar carrosséis consistentes.</p>
        </div>
        <div className="rounded-full border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-bold text-white/70">
          {brands.length}/{limit} marcas
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-white/10 bg-[#191a1d] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white/55">Suas marcas</h2>
            <button onClick={createBrand} disabled={brands.length >= limit} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white disabled:opacity-35">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {brands.map((brand) => (
              <button key={brand.id} onClick={() => selectBrand(brand)} className={`w-full rounded-2xl p-3 text-left transition ${selectedBrandId === brand.id ? 'bg-[#2f3135]' : 'hover:bg-white/[0.05]'}`}>
                <span className="block truncate text-sm font-bold">{brand.name}</span>
                <span className="mt-2 flex gap-1">
                  <i className="h-3 w-3 rounded-full border border-white/20" style={{ background: brand.primary_color }} />
                  <i className="h-3 w-3 rounded-full border border-white/20" style={{ background: brand.secondary_color }} />
                  {brand.is_default && <span className="ml-auto text-[10px] font-bold text-cyan-300">PADRÃO</span>}
                </span>
              </button>
            ))}
            {brands.length === 0 && <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-white/45">Nenhum kit criado ainda.</p>}
          </div>
        </aside>

        <form onSubmit={saveBrand} className="space-y-5">
          <section className="rounded-3xl border border-white/10 bg-[#191a1d] p-6">
            <div className="mb-5 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-cyan-300" />
              <h2 className="text-xl font-bold">Identidade da marca</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome da marca" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 outline-none focus:border-cyan-300/50" />
              <input value={form.tagline} onChange={(event) => setForm({ ...form, tagline: event.target.value })} placeholder="Slogan" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 outline-none focus:border-cyan-300/50" />
              <input value={form.niche} onChange={(event) => setForm({ ...form, niche: event.target.value })} placeholder="Nicho" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 outline-none focus:border-cyan-300/50" />
              <input value={form.targetAudience} onChange={(event) => setForm({ ...form, targetAudience: event.target.value })} placeholder="Público-alvo" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 outline-none focus:border-cyan-300/50" />
              <input value={form.mainOffer} onChange={(event) => setForm({ ...form, mainOffer: event.target.value })} placeholder="Oferta principal" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 outline-none focus:border-cyan-300/50" />
              <input value={form.contentGoal} onChange={(event) => setForm({ ...form, contentGoal: event.target.value })} placeholder="Objetivo do conteúdo" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 outline-none focus:border-cyan-300/50" />
              <textarea value={form.audiencePains} onChange={(event) => setForm({ ...form, audiencePains: event.target.value })} placeholder="Dores e desejos do público" className="min-h-28 rounded-2xl border border-white/10 bg-black/25 px-4 py-4 outline-none focus:border-cyan-300/50 md:col-span-2" />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#191a1d] p-6">
            <div className="mb-5 flex items-center gap-3">
              <Palette className="h-5 w-5 text-purple-300" />
              <h2 className="text-xl font-bold">Visual</h2>
            </div>
            <div className="mb-5 grid gap-3 sm:grid-cols-4">
              {presets.map((preset) => (
                <button key={preset.name} type="button" onClick={() => setForm({ ...form, primaryColor: preset.primary, secondaryColor: preset.secondary, bgColor: preset.bg })} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-left hover:bg-white/[0.05]">
                  <span className="mb-3 flex h-8 overflow-hidden rounded-xl">
                    <i className="flex-1" style={{ background: preset.bg }} />
                    <i className="w-8" style={{ background: preset.primary }} />
                    <i className="w-8" style={{ background: preset.secondary }} />
                  </span>
                  <span className="text-xs font-bold text-white/70">{preset.name}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {colorFields.map((field) => (
                <label key={field.key} className="grid gap-2 text-sm font-semibold text-white/60">
                  {field.label}
                  <div className="flex gap-3">
                    <input type="color" value={form[field.key]} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} className="h-12 w-12 rounded-xl bg-transparent" />
                    <input value={form[field.key]} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-mono outline-none" />
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <select value={form.fontDisplay} onChange={(event) => setForm({ ...form, fontDisplay: event.target.value })} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 outline-none">
                {['Outfit', 'Space Grotesk', 'Syne', 'Montserrat', 'Playfair Display'].map((font) => <option key={font}>{font}</option>)}
              </select>
              <select value={form.fontBody} onChange={(event) => setForm({ ...form, fontBody: event.target.value })} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 outline-none">
                {['Inter', 'DM Sans', 'Roboto', 'Plus Jakarta Sans', 'Lora'].map((font) => <option key={font}>{font}</option>)}
              </select>
            </div>

            <label className="mt-5 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-black/20 p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">Logo da marca</span>
                <span className="block truncate text-xs text-white/45">{form.logoUrl || 'Enviar PNG, SVG ou WebP'}</span>
              </span>
              <input type="file" accept="image/png,image/svg+xml,image/webp" onChange={uploadLogo} className="hidden" />
            </label>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#191a1d] p-6">
            <div className="mb-5 flex items-center gap-3">
              <Type className="h-5 w-5 text-emerald-300" />
              <h2 className="text-xl font-bold">Tom de voz</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-5">
              {['Profissional', 'Educativo', 'Descontraído', 'Urgente', 'Motivacional'].map((tone) => (
                <button key={tone} type="button" onClick={() => setForm({ ...form, tone })} className={`rounded-2xl border px-3 py-3 text-sm font-bold ${form.tone === tone ? 'border-cyan-300/50 bg-cyan-300/10 text-white' : 'border-white/10 bg-black/20 text-white/55'}`}>
                  {tone}
                </button>
              ))}
            </div>
            <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-white/70">
              <input type="checkbox" checked={form.isDefault} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} />
              Usar como Brand Kit padrão
            </label>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={deleteBrand} disabled={brands.length <= 1} className="inline-flex items-center gap-2 rounded-full border border-red-400/20 px-5 py-3 text-sm font-bold text-red-200 disabled:opacity-35">
              <Trash2 className="h-4 w-4" /> Excluir
            </button>
            <div className="flex items-center gap-3">
              {saved && <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-300"><Check className="h-4 w-4" /> Salvo</span>}
              <button disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Brand Kit
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
