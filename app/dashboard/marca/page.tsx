'use client'

import { useState } from 'react'
import { Sparkles, Palette, Type, MessageSquare, Upload, Save } from 'lucide-react'

export default function BrandKitPage() {
  const [saving, setSaving] = useState(false)
  
  // Mock state for now
  const [brand, setBrand] = useState({
    name: 'Minha Marca',
    tagline: 'Especialista em Marketing',
    tone: 'Profissional',
    primaryColor: '#7C3AED',
    secondaryColor: '#06B6D4',
    bgColor: '#0A0A0F',
    fontDisplay: 'Space Grotesk',
    fontBody: 'Inter'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => setSaving(false), 1000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-[family-name:var(--font-bricolage)] font-bold text-white mb-2">
          Brand Kit
        </h1>
        <p className="text-[var(--text-muted)]">
          Configure a identidade da sua marca. A IA usará essas regras para gerar todos os seus carrosséis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Identidade Básica */}
        <section className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-dark)] pb-4">
            <Sparkles className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-semibold text-white">
              Identidade Básica
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Nome da Marca / @</label>
              <input 
                type="text" 
                value={brand.name}
                onChange={e => setBrand({...brand, name: e.target.value})}
                className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white placeholder:text-[var(--text-muted2)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Slogan / Subtítulo</label>
              <input 
                type="text" 
                value={brand.tagline}
                onChange={e => setBrand({...brand, tagline: e.target.value})}
                className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white placeholder:text-[var(--text-muted2)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Logo</label>
              <div className="flex items-center gap-4 p-4 border border-dashed border-[var(--border-dark)] rounded-xl bg-[#ffffff05] hover:bg-[#ffffff0a] transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-white font-bold text-xl">
                  {brand.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-white flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Trocar logo
                  </div>
                  <div className="text-xs text-[var(--text-muted2)] mt-1">Recomendado: fundo transparente, PNG ou SVG</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cores */}
        <section className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-dark)] pb-4">
            <Palette className="w-5 h-5 text-[var(--brand-primary)]" />
            <h2 className="text-xl font-[family-name:var(--font-bricolage)] font-semibold text-white">
              Cores
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Cor Primária</label>
              <div className="flex gap-3">
                <input 
                  type="color" 
                  value={brand.primaryColor}
                  onChange={e => setBrand({...brand, primaryColor: e.target.value})}
                  className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <input 
                  type="text" 
                  value={brand.primaryColor}
                  onChange={e => setBrand({...brand, primaryColor: e.target.value})}
                  className="flex-1 bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-2 text-white font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Cor Secundária</label>
              <div className="flex gap-3">
                <input 
                  type="color" 
                  value={brand.secondaryColor}
                  onChange={e => setBrand({...brand, secondaryColor: e.target.value})}
                  className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <input 
                  type="text" 
                  value={brand.secondaryColor}
                  onChange={e => setBrand({...brand, secondaryColor: e.target.value})}
                  className="flex-1 bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-2 text-white font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Cor de Fundo</label>
              <div className="flex gap-3">
                <input 
                  type="color" 
                  value={brand.bgColor}
                  onChange={e => setBrand({...brand, bgColor: e.target.value})}
                  className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
                <input 
                  type="text" 
                  value={brand.bgColor}
                  onChange={e => setBrand({...brand, bgColor: e.target.value})}
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
              Tipografia
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Fonte de Títulos</label>
              <select 
                value={brand.fontDisplay}
                onChange={e => setBrand({...brand, fontDisplay: e.target.value})}
                className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--brand-primary)] appearance-none"
              >
                <option value="Space Grotesk">Space Grotesk</option>
                <option value="Syne">Syne</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Playfair Display">Playfair Display</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-muted)]">Fonte de Texto</label>
              <select 
                value={brand.fontBody}
                onChange={e => setBrand({...brand, fontBody: e.target.value})}
                className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--brand-primary)] appearance-none"
              >
                <option value="Inter">Inter</option>
                <option value="DM Sans">DM Sans</option>
                <option value="Roboto">Roboto</option>
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
              Voz e Tom
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-[var(--text-muted)]">Como sua marca se comunica?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['Profissional', 'Descontraído', 'Urgente', 'Motivacional'].map((tone) => (
                <div 
                  key={tone}
                  onClick={() => setBrand({...brand, tone})}
                  className={`p-3 text-center rounded-xl cursor-pointer transition-all border ${
                    brand.tone === tone 
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

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? 'Salvando...' : <><Save className="w-5 h-5" /> Salvar Brand Kit</>}
          </button>
        </div>
      </form>
    </div>
  )
}
