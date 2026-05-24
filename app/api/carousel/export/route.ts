import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { renderCarouselToPngs } from '@/lib/server/carousel-renderer'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const limited = checkRateLimit(`carousel:export:${user.id}:${getClientIp(req)}`, 20, 60 * 60 * 1000)
    if (!limited.allowed) {
      return rateLimitResponse(limited.resetAt)
    }

    const { carouselId } = await req.json()

    if (typeof carouselId !== 'string' || !carouselId) {
      return NextResponse.json({ error: 'Carrossel obrigatório.' }, { status: 400 })
    }

    const { data: carousel, error: carouselError } = await supabase
      .from('carousels')
      .select('id, html_content, slide_count')
      .eq('id', carouselId)
      .eq('user_id', user.id)
      .single()

    if (carouselError || !carousel?.html_content) {
      return NextResponse.json({ error: 'Carrossel não encontrado.' }, { status: 404 })
    }

    const urls = await renderCarouselToPngs({
      supabase,
      userId: user.id,
      carouselId: carousel.id,
      html: carousel.html_content,
      slideCount: Math.min(7, Math.max(1, Number(carousel.slide_count) || 7))
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
