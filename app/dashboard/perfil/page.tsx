'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Mail, 
  KeyRound, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  FileText, 
  Palette, 
  ArrowUpRight, 
  Check, 
  AlertCircle, 
  Loader2,
  Calendar,
  Layers,
  Crown
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

// Pre-defined premium geometric/gradient avatars for fast customisation
const PREMIUM_AVATARS = [
  { name: 'Aurora Glow', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Aurora' },
  { name: 'Cyber Neon', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Cyber' },
  { name: 'Deep Cosmo', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Cosmo' },
  { name: 'Solar Spark', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Solar' },
  { name: 'Sunset Dream', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Sunset' },
  { name: 'Aqua Wave', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Aqua' },
  { name: 'Violet Dusk', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Violet' },
  { name: 'Forest Mint', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=Forest' },
]

export default function UserProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Profile data state
  const [profile, setProfile] = useState<any>(null)
  const [carouselsCount, setCarouselsCount] = useState(0)
  const [defaultBrand, setDefaultBrand] = useState<any>(null)

  // Form editing states
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number | null>(null)

  // Load all required profile details
  useEffect(() => {
    async function loadProfileData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // 1. Fetch user profile
        let { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        // Create profile if missing (resilience)
        if (profileError || !profileData) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'Criador',
              avatar_url: user.user_metadata?.avatar_url || PREMIUM_AVATARS[0].url,
              plan: 'free',
              credits: 1
            })
            .select('*')
            .single()

          if (newProfile) {
            profileData = newProfile
          }
        }

        if (profileData) {
          setProfile(profileData)
          setName(profileData.name || '')
          setAvatarUrl(profileData.avatar_url || '')
          
          // Match standard avatars if already selected
          const matchedIndex = PREMIUM_AVATARS.findIndex(av => av.url === profileData.avatar_url)
          if (matchedIndex !== -1) {
            setSelectedAvatarIndex(matchedIndex)
          }
        }

        // 2. Fetch carousels count
        const { count, error: countError } = await supabase
          .from('carousels')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (!countError && count !== null) {
          setCarouselsCount(count)
        }

        // 3. Fetch default brand kit details
        const { data: brandsData } = await supabase
          .from('brands')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })

        if (brandsData && brandsData.length > 0) {
          const mainBrand = brandsData.find(b => b.is_default) || brandsData[0]
          setDefaultBrand(mainBrand)
        }

      } catch (err) {
        console.error('Erro ao buscar dados do perfil:', err)
        setError('Ocorreu um erro ao carregar as informações do perfil.')
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [])

  // Handle avatar select from gallery
  const handleSelectAvatar = (url: string, index: number) => {
    setAvatarUrl(url)
    setSelectedAvatarIndex(index)
  }

  // Handle manual input of avatar URL
  const handleCustomAvatarUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setAvatarUrl(val)
    
    // De-select premium avatar if custom URL is manually written and doesn't match
    const matchedIndex = PREMIUM_AVATARS.findIndex(av => av.url === val)
    setSelectedAvatarIndex(matchedIndex !== -1 ? matchedIndex : null)
  }

  // Handle updates submission
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    if (!name.trim()) {
      setError('Por favor, informe seu nome de exibição.')
      setSaving(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          avatar_url: avatarUrl.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        
        // Dispara evento global para que o layout atualize os dados da sidebar em tempo real
        window.dispatchEvent(new Event('profile-updated'))
        
        // Hide success message automatically after 3 seconds
        setTimeout(() => {
          setSuccess(false)
        }, 3000)
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão ao salvar perfil.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--brand-primary)]" />
        <p className="text-[var(--text-muted)] text-sm">Carregando dados da sua conta...</p>
      </div>
    )
  }

  // Calculate credits progress
  const planName = profile?.plan || 'free'
  const maxCredits = planName === 'free' ? 1 : planName === 'starter' ? 30 : planName === 'pro' ? 80 : 200
  const usedCreditsPercent = Math.min(100, Math.max(0, ((profile?.credits ?? 0) / maxCredits) * 100))
  const displayPlanLabel = 
    planName === 'free' ? 'Grátis' : 
    planName === 'starter' ? 'Iniciante' : 
    planName === 'pro' ? 'Pro Creator' : 'Agência'

  return (
    <div className="w-full relative py-6 max-w-5xl mx-auto px-2">
      {/* Decorative Glows */}
      <div className="hero-glow" style={{ top: '-10%', left: '20%', opacity: 0.15 }}></div>
      <div className="hero-glow" style={{ bottom: '10%', right: '10%', opacity: 0.1 }}></div>

      {/* Breadcrumb / Title */}
      <div className="mb-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 px-2.5 py-1 rounded-full border border-[var(--brand-primary)]/20">
            Painel de Controle
          </span>
          <h1 className="text-4xl font-[family-name:var(--font-bricolage)] font-bold text-white mt-3">
            Meu Perfil
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Gerencie sua identidade visual, assinatura e configurações de segurança.
          </p>
        </div>

        {/* Quick Date Display */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted2)] bg-[#ffffff05] border border-[var(--border-dark)] px-3.5 py-2 rounded-xl backdrop-blur-md">
          <Calendar className="w-4 h-4 text-[var(--accent)]" />
          <span>Membro desde: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '...'}</span>
        </div>
      </div>

      {/* Unified Banner card */}
      <div className="relative z-10 mb-8 overflow-hidden rounded-2xl border border-[var(--border-dark)] bg-gradient-to-r from-[var(--surface-dark)] via-[#0f111a]/80 to-[#1b152d]/40 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)]/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-[var(--brand-primary)] shadow-lg bg-[#181a24] flex items-center justify-center">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={name || 'Avatar'} 
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-115"
                  onError={(e) => {
                    // Fallback to initial if URL fails
                    ;(e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${name || 'Criador'}`
                  }}
                />
              ) : (
                <User className="w-12 h-12 text-[var(--text-muted)]" />
              )}
            </div>
            
            {/* Glowing plan badge overlay */}
            <div className="absolute -bottom-2 -right-2 flex items-center gap-1 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-lg border border-[#ffffff22]">
              <Crown className="w-3 h-3" />
              <span>{displayPlanLabel}</span>
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-2.5">
              {name || 'Nome do Criador'}
            </h2>
            <p className="text-[var(--text-muted)] text-sm flex items-center justify-center md:justify-start gap-1.5 mt-1">
              <Mail className="w-4 h-4 text-[var(--text-muted2)]" />
              {profile?.email}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
              <span className="text-xs bg-[#ffffff05] border border-[var(--border-dark)] px-3 py-1 rounded-lg text-white">
                Plano: <strong className="text-[var(--brand-primary)] capitalize">{planName}</strong>
              </span>
              <span className="text-xs bg-[#ffffff05] border border-[var(--border-dark)] px-3 py-1 rounded-lg text-white">
                Limites: <strong className="text-[var(--accent)]">{profile?.credits} de {maxCredits} créditos</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Info Edit & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Left 2 Cols: Profile Form and Avatar Selection */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-xl relative">
            <h3 className="text-xl font-[family-name:var(--font-bricolage)] font-semibold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-[var(--brand-primary)]" />
              Editar Dados Pessoais
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3 animate-shake">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm flex items-center gap-3 animate-fade-in">
                  <Check className="w-5 h-5 shrink-0" />
                  <span>Perfil atualizado com sucesso! Sincronização ativada.</span>
                </div>
              )}

              {/* Name field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-muted)]">
                  Nome de Exibição
                </label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white placeholder:text-[var(--text-muted2)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all text-sm font-medium"
                  placeholder="Seu nome ou marca"
                />
              </div>

              {/* Avatar Selector Gallery */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-[var(--text-muted)]">
                    Escolha um Avatar Premium
                  </label>
                  <span className="text-[11px] text-[var(--text-muted2)] font-medium">1 clique para aplicar</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {PREMIUM_AVATARS.map((av, index) => {
                    const isSelected = selectedAvatarIndex === index
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectAvatar(av.url, index)}
                        className={`relative rounded-xl aspect-square overflow-hidden border-2 bg-[#14151f] hover:scale-105 transition-all p-0.5 group ${
                          isSelected 
                            ? 'border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20 scale-102' 
                            : 'border-[var(--border-dark)] opacity-70 hover:opacity-100'
                        }`}
                        title={av.name}
                      >
                        <img 
                          src={av.url} 
                          alt={av.name} 
                          className="w-full h-full object-cover rounded-lg"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[var(--brand-primary)]/15 flex items-center justify-center">
                            <span className="bg-[var(--brand-primary)] text-white p-0.5 rounded-full">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          </div>
                        )}
                        <span className="absolute bottom-0 left-0 right-0 text-[8px] bg-black/60 text-white truncate text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {av.name.split(' ')[0]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Avatar URL Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text-muted)]">
                  URL da Foto Personalizada (Opcional)
                </label>
                <input 
                  type="url"
                  value={avatarUrl}
                  onChange={handleCustomAvatarUrlChange}
                  className="w-full bg-[#00000033] border border-[var(--border-dark)] rounded-xl px-4 py-3 text-white placeholder:text-[var(--text-muted2)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all text-sm font-mono text-xs"
                  placeholder="https://exemplo.com/sua-foto.jpg"
                />
                <p className="text-[10px] text-[var(--text-muted2)]">
                  Insira um link direto de imagem (.png, .jpg) para carregar uma foto externa de sua preferência.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 border-t border-[var(--border-dark)]/50 flex justify-end">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex items-center gap-2 justify-center px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--accent)] text-white hover:brightness-110 transition-all shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <span>Salvar Perfil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Connected Brand Kit Preview */}
          <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--brand-primary)]/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[var(--border-dark)]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-md font-bold text-white font-[family-name:var(--font-bricolage)]">
                    Identidade Visual (Brand Kit)
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">Ativo para geração de carrosséis</p>
                </div>
              </div>
              <Link 
                href="/dashboard/marca" 
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#ffffff0a] text-white border border-[var(--border-dark)] hover:bg-[#ffffff14] transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                Gerenciar Brand Kit
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </Link>
            </div>

            {defaultBrand ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3.5">
                  <div>
                    <span className="text-xs text-[var(--text-muted2)] block">Nome da Empresa</span>
                    <span className="font-semibold text-white mt-0.5 block">{defaultBrand.name}</span>
                  </div>
                  {defaultBrand.tagline && (
                    <div>
                      <span className="text-xs text-[var(--text-muted2)] block">Slogan/Tagline</span>
                      <span className="text-white mt-0.5 block italic truncate">"{defaultBrand.tagline}"</span>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-[var(--text-muted2)] block">Tom de Voz Principal</span>
                    <span className="capitalize font-medium text-[var(--brand-primary)] mt-0.5 block">{defaultBrand.tone || 'Profissional'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-[var(--text-muted2)] block mb-1.5">Paleta de Cores</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: defaultBrand.primary_color }} />
                        <span className="text-xs font-mono text-[var(--text-muted)]">{defaultBrand.primary_color}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: defaultBrand.secondary_color }} />
                        <span className="text-xs font-mono text-[var(--text-muted)]">{defaultBrand.secondary_color}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: defaultBrand.bg_color }} />
                        <span className="text-xs font-mono text-[var(--text-muted)]">{defaultBrand.bg_color}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-[var(--text-muted2)] block">Fonte Display</span>
                      <span className="font-semibold text-white font-[family-name:var(--font-bricolage)] mt-0.5 block">{defaultBrand.font_display}</span>
                    </div>
                    <div>
                      <span className="text-xs text-[var(--text-muted2)] block">Fonte Corpo</span>
                      <span className="text-white mt-0.5 block">{defaultBrand.font_body}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-[var(--text-muted)] border border-dashed border-[var(--border-dark)] rounded-xl bg-black/10">
                <p>Nenhuma identidade visual configurada.</p>
                <Link href="/dashboard/marca" className="text-xs text-[var(--brand-primary)] font-semibold mt-2 inline-block hover:underline">
                  Configurar primeiro Brand Kit agora
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Usage Statistics & Account Security Actions */}
        <div className="space-y-8">
          
          {/* Card: Credits and Generation Usage */}
          <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
            <h3 className="text-lg font-[family-name:var(--font-bricolage)] font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-[var(--accent)]" />
              Consumo de Créditos
            </h3>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Gerações Disponíveis</span>
                <span className="text-sm font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded border border-[var(--accent)]/20">
                  {profile?.credits} / {maxCredits}
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="space-y-1">
                <div className="w-full h-3 bg-[#00000055] rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--accent)] rounded-full transition-all duration-500"
                    style={{ width: `${usedCreditsPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-[var(--text-muted2)] font-medium">
                  <span>Vazio</span>
                  <span>{usedCreditsPercent.toFixed(0)}% Limite Ativo</span>
                  <span>Cheio</span>
                </div>
              </div>

              {/* Total Carousels Created Badge */}
              <div className="p-4 rounded-xl bg-white/5 border border-[var(--border-dark)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs text-[var(--text-muted2)] block">Carrosséis Criados</span>
                    <span className="text-sm font-bold text-white block mt-0.5">Total de {carouselsCount}</span>
                  </div>
                </div>
                <Link href="/dashboard" className="text-xs font-semibold text-[var(--brand-primary)] hover:underline flex items-center gap-0.5">
                  Ver
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Upgrade Call-to-action */}
              {planName === 'free' && (
                <div className="pt-2">
                  <Link 
                    href="/dashboard/planos"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--accent)] text-white hover:brightness-110 transition-all text-xs shadow-md"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Fazer Upgrade de Plano
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Card: Account Security Control Panel */}
          <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-6 shadow-xl backdrop-blur-xl relative">
            <h3 className="text-lg font-[family-name:var(--font-bricolage)] font-semibold text-white mb-5 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Segurança e Acesso
            </h3>
            
            <p className="text-xs text-[var(--text-muted)] mb-5 leading-relaxed">
              Mantenha os dados de sua credencial sempre atualizados e evite perdas de acesso.
            </p>

            <div className="space-y-3.5">
              {/* Change email button */}
              <Link 
                href="/dashboard/alterar-email" 
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-dark)] bg-white/5 hover:bg-[#ffffff0c] text-white transition-all text-xs font-medium group"
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4.5 h-4.5 text-[var(--brand-primary)] shrink-0" />
                  <div className="text-left">
                    <span className="block font-semibold">Alterar E-mail</span>
                    <span className="block text-[10px] text-[var(--text-muted2)]">Novo endereço corporativo</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--text-muted2)] group-hover:text-white transition-colors shrink-0" />
              </Link>

              {/* Change password button */}
              <Link 
                href="/dashboard/alterar-senha" 
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-dark)] bg-white/5 hover:bg-[#ffffff0c] text-white transition-all text-xs font-medium group"
              >
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-4.5 h-4.5 text-[var(--accent)] shrink-0" />
                  <div className="text-left">
                    <span className="block font-semibold">Alterar Senha</span>
                    <span className="block text-[10px] text-[var(--text-muted2)]">Redefinir chave de acesso</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--text-muted2)] group-hover:text-white transition-colors shrink-0" />
              </Link>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
