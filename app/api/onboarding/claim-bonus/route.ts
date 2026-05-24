import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabaseAdmin
      .rpc('claim_onboarding_bonus', { p_user_id: user.id })
      .single()
    const bonusResult = data as { new_credits?: number; bonus_claimed?: boolean } | null

    if (error) {
      const message = error.message || ''

      if (message.includes('brand_required')) {
        return NextResponse.json({ error: 'Configure seu Brand Kit antes de resgatar o bonus.' }, { status: 400 })
      }

      if (message.includes('carousel_required')) {
        return NextResponse.json({ error: 'Gere seu primeiro carrossel antes de resgatar o bonus.' }, { status: 400 })
      }

      console.error('Error claiming onboarding bonus:', error)
      return NextResponse.json({ error: 'Erro ao resgatar bonus.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      credits: bonusResult?.new_credits ?? 0,
      claimed: bonusResult?.bonus_claimed ?? true
    })
  } catch (error: any) {
    console.error('Unexpected onboarding bonus error:', error)
    return NextResponse.json({ error: 'Erro ao resgatar bonus.' }, { status: 500 })
  }
}
