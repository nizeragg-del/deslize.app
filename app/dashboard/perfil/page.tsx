'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Check, CreditCard, Loader2, Mail, Save, ShieldCheck, Sparkles, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const avatarSeeds = ['Aurora', 'Cyber', 'Cosmo', 'Solar', 'Aqua', 'Violet']
const avatarUrls = avatarSeeds.map((seed) => `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}`)

export default function UserProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [carouselsCount, setCarouselsCount] = useState(0)

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      let { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      if (!data) {
        const { data: created } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Criador',
            avatar_url: user.user_metadata?.avatar_url || avatarUrls[0],
            plan: 'free',
            credits: 1,
          })
          .select('*')
          .single()
        data = created
      }

      const { count } = await supabase.from('carousels').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

      setProfile(data)
      setName(data?.name || '')
      setAvatarUrl(data?.avatar_url || '')
      setCarouselsCount(count || 0)
      setLoading(false)
    }

    loadProfile()
  }, [])

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !name.trim()) {
      setError('Informe um nome para continuar.')
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ name: name.trim(), avatar_url: avatarUrl.trim(), updated_at: new Date().toISOString() })
      .eq('id', user.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    window.dispatchEvent(new Event('profile-updated'))
    setTimeout(() => setSuccess(false), 2600)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
      </div>
    )
  }

  const plan = profile?.plan === 'free' ? 'Grátis' : profile?.plan || 'Grátis'
  const maxCredits = profile?.plan === 'starter' ? 30 : profile?.plan === 'pro' ? 80 : profile?.plan === 'agency' ? 200 : 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-cyan-300">Conta</p>
          <h1 className="mt-2 text-4xl font-bold">Perfil</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">Ajuste sua identidade de usuário e acompanhe o uso da sua conta.</p>
        </div>
        <Link href="/dashboard" className="rounded-full border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-bold text-white/80 hover:bg-white/10">
          Voltar ao Studio
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-[#191a1d] p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-300">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="text-sm text-white/50">Plano atual</p>
          <h2 className="mt-2 text-4xl font-bold capitalize">{plan}</h2>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#191a1d] p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-sm text-white/50">Créditos disponíveis</p>
          <h2 className="mt-2 text-4xl font-bold">
            {profile?.credits || 0}<span className="text-lg text-white/35">/{maxCredits}</span>
          </h2>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[#191a1d] p-6">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-sm text-white/50">Carrosséis criados</p>
          <h2 className="mt-2 text-4xl font-bold">{carouselsCount}</h2>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form onSubmit={saveProfile} className="rounded-3xl border border-white/10 bg-[#191a1d] p-6">
          <h2 className="mb-6 text-xl font-bold">Dados pessoais</h2>

          {error && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              <Check className="h-4 w-4" /> Perfil atualizado.
            </div>
          )}

          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white/60">Nome de exibição</span>
              <input value={name} onChange={(event) => setName(event.target.value)} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none focus:border-cyan-300/50" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white/60">E-mail</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white/55">
                <Mail className="h-4 w-4" />
                {profile?.email || 'Sem e-mail'}
              </div>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white/60">URL do avatar</span>
              <input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none focus:border-cyan-300/50" />
            </label>
          </div>

          <button disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar perfil
          </button>
        </form>

        <aside className="rounded-3xl border border-white/10 bg-[#191a1d] p-6">
          <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-[#2b2e33]">
            {avatarUrl ? <img src={avatarUrl} alt={name || 'Avatar'} className="h-full w-full object-cover" /> : <User className="h-10 w-10 text-white/40" />}
          </div>
          <h2 className="text-center text-xl font-bold">{name || 'Criador'}</h2>
          <p className="mt-1 text-center text-sm text-white/45">{profile?.email}</p>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {avatarUrls.map((url) => (
              <button key={url} onClick={() => setAvatarUrl(url)} className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-1 hover:border-cyan-300/50">
                <img src={url} alt="Avatar" className="h-full w-full rounded-xl object-cover" />
              </button>
            ))}
          </div>
        </aside>
      </section>
    </div>
  )
}
