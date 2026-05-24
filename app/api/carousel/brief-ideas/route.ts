import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/utils/supabase/server'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/server/rate-limit'

export const maxDuration = 30

type BriefIdeaResponse = {
  brief: unknown
  title?: string
  angles?: string[]
}

const cleanJson = (text: string) => {
  let cleaned = text.trim()
  if (cleaned.includes('```json')) {
    cleaned = cleaned.split('```json')[1].split('```')[0].trim()
  } else if (cleaned.includes('```')) {
    cleaned = cleaned.split('```')[1].split('```')[0].trim()
  }
  return cleaned
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })
    }

    const limited = checkRateLimit(`carousel:ideas:${user.id}:${getClientIp(req)}`, 30, 60 * 60 * 1000)
    if (!limited.allowed) {
      return rateLimitResponse(limited.resetAt)
    }

    const body = await req.json().catch(() => ({}))
    const brandId = typeof body.brandId === 'string' ? body.brandId : ''
    const currentBrief = typeof body.currentBrief === 'string' ? body.currentBrief.trim() : ''

    let query = supabase
      .from('brands')
      .select('id, name, tagline, tone, niche, target_audience, main_offer, audience_pains, content_goal')
      .eq('user_id', user.id)

    if (brandId && brandId !== 'default') {
      query = query.eq('id', brandId)
    } else {
      query = query.order('is_default', { ascending: false }).order('created_at', { ascending: true }).limit(1)
    }

    const { data: brand, error } = await query.single()

    if (error || !brand) {
      return NextResponse.json({ error: 'Configure um Brand Kit antes de gerar ideias com IA.' }, { status: 400 })
    }

    const prompt = `
VocÃª Ã© um estrategista de conteÃºdo especialista em carrossÃ©is de Instagram para vendas e autoridade.

Use o contexto abaixo para criar UM brief de carrossel altamente especÃ­fico, pronto para ser enviado a um gerador de carrossel.

MARCA:
- Nome: ${brand.name}
- Slogan: ${brand.tagline || 'nÃ£o informado'}
- Tom da marca: ${brand.tone || 'Profissional'}
- Nicho: ${brand.niche || 'nÃ£o informado'}
- PÃºblico-alvo: ${brand.target_audience || 'nÃ£o informado'}
- Oferta principal: ${brand.main_offer || 'nÃ£o informado'}
- Dores/desejos do pÃºblico: ${brand.audience_pains || 'nÃ£o informado'}
- Objetivo do conteÃºdo: ${brand.content_goal || 'gerar interesse e conversas'}

BRIEF ATUAL DO USUÃRIO:
${currentBrief || 'Nenhum. Crie uma ideia nova baseada no Brand Kit.'}

REGRAS:
- Se houver brief atual, refine e deixe mais estratÃ©gico sem fugir do tema.
- Se nÃ£o houver brief atual, escolha um tema forte para o nicho da marca.
- O resultado deve ser em portuguÃªs do Brasil.
- Seja especÃ­fico sobre gancho, pÃºblico, promessa, desenvolvimento e CTA.
- NÃ£o escreva o carrossel slide a slide; escreva um brief compacto para orientar a geraÃ§Ã£o.
- Retorne APENAS JSON vÃ¡lido neste formato:
{
  "title": "tema curto",
  "brief": "brief pronto para preencher o campo",
  "angles": ["angulo 1", "angulo 2", "angulo 3"]
}
`

    let response
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.85 },
      })
    } catch (apiError) {
      console.warn('Gemini 2.5 Flash failed, attempting fallback to Gemini 3.1 Flash Lite:', apiError)
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: { temperature: 0.85 },
      })
    }

    const text = response.text || ''
    let parsed: BriefIdeaResponse

    try {
      parsed = JSON.parse(cleanJson(text))
    } catch (parseError) {
      console.warn('Failed to parse Gemini brief JSON:', parseError)
      parsed = {
        brief: text.trim(),
        angles: [],
      }
    }

    const briefText = typeof parsed.brief === 'string'
      ? parsed.brief
      : parsed.brief
        ? JSON.stringify(parsed.brief)
        : ''

    if (!briefText.trim()) {
      return NextResponse.json({ error: 'A IA nÃ£o retornou uma ideia vÃ¡lida.' }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      title: parsed.title || '',
      brief: briefText.trim(),
      angles: Array.isArray(parsed.angles) ? parsed.angles.slice(0, 3) : [],
    })
  } catch (err: any) {
    console.error('Error generating brief idea:', err)
    return NextResponse.json({ error: err.message || 'Erro ao gerar ideia com IA' }, { status: 500 })
  }
}
