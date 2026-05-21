import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { renderCarouselToPngs } from '@/lib/server/carousel-renderer'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { html, slideCount = 7, carouselId } = await req.json()

    if (!html) {
      return NextResponse.json({ error: 'HTML e obrigatorio' }, { status: 400 })
    }

    const urls = await renderCarouselToPngs({
      supabase,
      userId: user.id,
      carouselId: carouselId || 'temp',
      html,
      slideCount
    })

    return NextResponse.json({
      success: true,
      urls
    })
  } catch (error: any) {
    console.error('Error exporting carousel:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao exportar carrossel para PNG' },
      { status: 500 }
    )
  }
}
