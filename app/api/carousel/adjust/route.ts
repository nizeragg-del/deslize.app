import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/utils/supabase/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/server/rate-limit'
import { sanitizeCarouselSlidesHtml } from '@/lib/server/sanitize-carousel-html'
import { safeCssColor, safeFontFamily, safeHttpsUrl } from '@/lib/server/input-safety'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    // Initialize the SDK inside the request to ensure env variables are populated
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    
    // Validate authentication
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const limited = await checkRateLimit(`carousel:adjust:${user.id}`, 12, 60 * 60 * 1000)
    if (!limited.allowed) {
      return rateLimitResponse(limited.resetAt)
    }

    // Parse the request body
    const body = await req.json()
    const { currentHtml, instruction, slideIndex, visualTheme = 'Mínimo Moderno', brand } = body

    if (!currentHtml || !instruction) {
      return NextResponse.json({ error: 'HTML atual e instrução são obrigatórios' }, { status: 400 })
    }

    if (typeof currentHtml !== 'string' || currentHtml.length > 250_000) {
      return NextResponse.json({ error: 'Carrossel muito grande para ajuste.' }, { status: 413 })
    }

    if (typeof instruction !== 'string' || instruction.length > 4_000) {
      return NextResponse.json({ error: 'Instrução muito longa para ajuste.' }, { status: 413 })
    }

    const pColor = safeCssColor(brand?.primaryColor, '#7C3AED')
    const sColor = safeCssColor(brand?.secondaryColor, '#06B6D4')
    const bgColor = safeCssColor(brand?.bgColor, '#0A0A0F')
    const fontDisplay = safeFontFamily(brand?.fontDisplay, 'Outfit')
    const fontBody = safeFontFamily(brand?.fontBody, 'Inter')
    const logoUrl = safeHttpsUrl(brand?.logoUrl)
    const safeLogoUrl = logoUrl.replace(/"/g, '&quot;')
    const brandName = brand?.name || 'suamarca'
    const safeBrandName = String(brandName).replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const logoMarkup = safeLogoUrl
      ? `<div class="slide-logo"><img class="slide-logo-img" src="${safeLogoUrl}" alt="${safeBrandName}"></div>`
      : `<div class="slide-logo"><div class="slide-logo-dot" style="background-color: ${pColor}"></div><span class="slide-logo-text">${safeBrandName}</span></div>`

    // Dynamically load all fonts required: user's custom brand fonts + theme specific fallback fonts
    const fontsSet = new Set<string>()
    fontsSet.add(fontDisplay)
    fontsSet.add(fontBody)
    
    if (visualTheme === 'Neon Tech') {
      fontsSet.add('Space Grotesk')
      fontsSet.add('Share Tech Mono')
    } else if (visualTheme === 'Editorial Elegante') {
      fontsSet.add('Playfair Display')
      fontsSet.add('Plus Jakarta Sans')
    } else {
      fontsSet.add('Outfit')
      fontsSet.add('Inter')
    }

    const fontsParam = Array.from(fontsSet)
      .map(font => `family=${font.replace(/ /g, '+')}:wght@300;400;500;600;700;800`)
      .join('&')
    
    let fontHeaderImport = `<link href="https://fonts.googleapis.com/css2?${fontsParam}&display=swap" rel="stylesheet">`
    let themeStyles = ''
    let themeRules = ''

    if (visualTheme === 'Neon Tech') {
      themeStyles = `
        .title-font { font-family: 'Space Grotesk', sans-serif !important; text-transform: uppercase !important; letter-spacing: -1.5px !important; line-height: 1.05 !important; }
        .body-font { font-family: 'Share Tech Mono', monospace !important; font-weight: 400 !important; line-height: 1.6 !important; color: rgba(255,255,255,0.8) !important; }
        .ig-slide { background: #050508 !important; border: 1px solid rgba(255, 255, 255, 0.04) !important; color: #ffffff !important; position: relative; overflow: hidden; }
        .glow-ambient { 
          position: absolute; 
          width: 450px; 
          height: 450px; 
          border-radius: 50%; 
          background: radial-gradient(circle, ${pColor}14 0%, transparent 70%); 
          filter: blur(130px); 
          pointer-events: none; 
          z-index: 1; 
        }
        .glow-secondary { 
          position: absolute; 
          width: 450px; 
          height: 450px; 
          border-radius: 50%; 
          background: radial-gradient(circle, ${sColor}0B 0%, transparent 70%); 
          filter: blur(130px); 
          pointer-events: none; 
          z-index: 1; 
        }
        .gradient-span {
          background: linear-gradient(135deg, ${pColor} 0%, ${sColor} 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          text-shadow: 0 0 30px rgba(0, 255, 200, 0.2) !important;
        }
        .console-panel {
          background: rgba(255, 255, 255, 0.01) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          border-radius: 12px !important;
          padding: 22px !important;
          box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.01), 0 10px 30px rgba(0,0,0,0.5) !important;
          position: relative;
          z-index: 10;
        }
        .code-panel {
          font-family: 'Share Tech Mono', monospace !important;
          background: rgba(0, 0, 0, 0.6) !important;
          border: 1px solid rgba(0, 255, 200, 0.15) !important;
          border-left: 4px solid ${pColor} !important;
          border-radius: 8px !important;
          padding: 16px 20px !important;
          color: #00FFC8 !important;
          box-shadow: 0 0 20px rgba(0, 255, 200, 0.05) !important;
          position: relative;
          z-index: 10;
        }
        .slide-tag { color: #00FFC8 !important; text-shadow: 0 0 10px rgba(0, 255, 200, 0.4) !important; font-family: 'Share Tech Mono', monospace !important; }
      `
      themeRules = `
        ESTILO VISUAL DO CARROSSEL: NEON TECH (Tecnológico, Futurista, Programador)
        - Use fontes 'Space Grotesk' para títulos (sempre maiúsculos, letter-spacing de -1.5px) e 'Share Tech Mono' para o corpo.
        - Fundo digital ultra escuro (#050508) com glows atmosféricos usando as classes .glow-ambient (usando a cor primária ${pColor}) e .glow-secondary (usando a cor secundária ${sColor}). Insira uma div com .glow-ambient no canto superior esquerdo e uma div com .glow-secondary no canto inferior direito para um gradiente de luz espetacular.
        - Envolva as palavras de destaque nos títulos com <span class="gradient-span">...</span> para aplicar gradiente neon.
        - Os componentes de caixa de texto devem usar a classe .console-panel ou .code-panel para parecerem com consoles de desenvolvimento e terminal high-tech.
      `
    } else if (visualTheme === 'Editorial Elegante') {
      themeStyles = `
        .title-font { font-family: 'Playfair Display', serif !important; letter-spacing: -0.5px !important; line-height: 1.1 !important; }
        .body-font { font-family: 'Plus Jakarta Sans', sans-serif !important; font-weight: 400 !important; line-height: 1.6 !important; color: rgba(255,255,255,0.75) !important; }
        .ig-slide { background: #0F0E0C !important; border: 1px solid rgba(255, 255, 255, 0.03) !important; color: #F5F2EB !important; position: relative; overflow: hidden; }
        .slide-tag { font-style: italic !important; font-family: 'Playfair Display', serif !important; text-transform: none !important; letter-spacing: 1px !important; color: ${pColor} !important; }
        .gradient-span {
          background: linear-gradient(135deg, ${pColor} 0%, ${sColor} 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }
        .quote-box { 
          background: rgba(255, 255, 255, 0.02) !important; 
          border-left: 3px solid ${pColor} !important; 
          border-radius: 4px !important; 
          backdrop-filter: blur(10px) !important;
          padding: 20px !important;
          position: relative;
          z-index: 10;
        }
      `
      themeRules = `
        ESTILO VISUAL DO CARROSSEL: EDITORIAL ELEGANTE (Premium, Agência, Sofisticado)
        - Use fonte serifada 'Playfair Display' para títulos e subtítulos (pode usar itálicos para palavras em destaque) e 'Plus Jakarta Sans' para o corpo.
        - Fundo elegante escuro (#0F0E0C) com fontes e cores quentes (off-white, dourado, roxo ameixa, pêssego).
        - Margens internas amplas, visual minimalista de revista de luxo.
        - Envolva as palavras-chave com <span class="gradient-span">...</span> para destacar com o gradiente da marca.
        - As caixas de texto devem usar a classe .quote-box (com borda lateral elegante e fundo vidro).
      `
    } else { // Mínimo Moderno (Clean)
      themeStyles = `
        .title-font { font-family: 'Outfit', sans-serif !important; letter-spacing: -1.5px !important; line-height: 1.05 !important; }
        .body-font { font-family: 'Inter', sans-serif !important; font-weight: 400 !important; line-height: 1.6 !important; color: rgba(255,255,255,0.75) !important; }
        .ig-slide { background: #0B0B0F !important; border: 1px solid rgba(255, 255, 255, 0.04) !important; color: #F3F4F6 !important; position: relative; overflow: hidden; }
        .gradient-span {
          background: linear-gradient(135deg, ${pColor} 0%, ${sColor} 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }
        .glass-panel { 
          background: rgba(255, 255, 255, 0.02) !important; 
          border: 1px solid rgba(255, 255, 255, 0.06) !important; 
          border-radius: 16px !important; 
          backdrop-filter: blur(12px) !important; 
          padding: 22px !important;
          position: relative;
          z-index: 10;
        }
      `
      themeRules = `
        ESTILO VISUAL DO CARROSSEL: MÍNIMO MODERNO (Clean, Startup, Alto Nível)
        - Use fonte 'Outfit' para os títulos com letras bem juntas (letter-spacing negativo) e 'Inter' para o corpo.
        - Fundo escuro premium (#0B0B0F).
        - Envolva palavras principais do título com <span class="gradient-span">...</span>.
        - Use caixas de texto modernas com efeito vidro utilizando a classe .glass-panel.
        - Visual limpo, geométrico e direto.
      `
    }

    // Force exact custom brand kit properties (fonts, background color, gradients) if provided
    themeStyles += `
      .title-font { font-family: '${fontDisplay}', sans-serif !important; }
      .body-font { font-family: '${fontBody}', sans-serif !important; }
      .ig-slide {
        width: 100% !important;
        min-width: 100% !important;
        height: 100% !important;
        padding: 78px 28px 92px !important;
        background: ${bgColor} !important;
        color: #F8FAFC !important;
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        overflow: hidden !important;
      }
      .ig-slide * { box-sizing: border-box !important; max-width: 100% !important; }
      .slide-tag {
        position: absolute !important;
        top: 34px !important;
        left: 28px !important;
        max-width: 210px !important;
        font-size: 10px !important;
        line-height: 1.2 !important;
        font-weight: 800 !important;
        letter-spacing: 1.5px !important;
        color: ${pColor} !important;
        text-transform: none !important;
        z-index: 20 !important;
      }
      .slide-logo {
        position: absolute !important;
        top: 32px !important;
        right: 28px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        max-width: 130px !important;
        z-index: 20 !important;
      }
      .slide-logo-dot { width: 16px !important; height: 16px !important; border-radius: 999px !important; flex-shrink: 0 !important; }
      .slide-logo-text { font-size: 14px !important; line-height: 1 !important; font-weight: 800 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
      .slide-logo-img { display: block !important; width: auto !important; height: 24px !important; max-width: 96px !important; object-fit: contain !important; object-position: center !important; }
      .slide-h {
        font-family: '${fontDisplay}', sans-serif !important;
        font-size: 28px !important;
        line-height: 1.08 !important;
        font-weight: 800 !important;
        letter-spacing: 0 !important;
        margin: 0 0 14px !important;
        text-align: left !important;
        position: relative !important;
        z-index: 10 !important;
        width: 100% !important;
        max-width: 100% !important;
        max-height: 94px !important;
        overflow: hidden !important;
      }
      .slide-body {
        font-family: '${fontBody}', sans-serif !important;
        font-size: 15px !important;
        line-height: 1.5 !important;
        color: rgba(255,255,255,0.78) !important;
        text-align: left !important;
        margin: 0 !important;
        max-width: 96% !important;
        max-height: 82px !important;
        overflow: hidden !important;
        position: relative !important;
        z-index: 10 !important;
      }
      .slide-content {
        width: 100% !important;
        max-width: 100% !important;
        max-height: 270px !important;
        margin: auto 0 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        justify-content: center !important;
        gap: 12px !important;
        position: relative !important;
        z-index: 10 !important;
        overflow: hidden !important;
      }
      .slide-num-bg { pointer-events: none !important; }
      .slide-progress { position: absolute !important; bottom: 40px !important; left: 28px !important; right: 28px !important; z-index: 20 !important; }
      .gradient-span {
        background: linear-gradient(135deg, ${pColor} 0%, ${sColor} 100%) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
      }
      .glass-panel, .console-panel, .quote-box {
        padding: 14px !important;
        margin: 0 auto !important;
        max-width: 100% !important;
        max-height: 112px !important;
        overflow: hidden !important;
      }
      .brand-ribbon { position: absolute !important; height: 18px !important; border-radius: 999px !important; background: linear-gradient(90deg, ${pColor}, ${sColor}) !important; opacity: 0.9 !important; z-index: 2 !important; }
      .accent-arc { position: absolute !important; width: 210px !important; height: 210px !important; border: 22px solid ${pColor} !important; border-radius: 999px !important; opacity: 0.2 !important; z-index: 1 !important; }
      .soft-grid { position: absolute !important; inset: 0 !important; background-image: linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px) !important; background-size: 42px 42px !important; mask-image: linear-gradient(to bottom, transparent, black 20%, black 75%, transparent) !important; opacity: 0.35 !important; z-index: 1 !important; }
      .kicker-pill { display: inline-flex !important; align-items: center !important; gap: 6px !important; padding: 6px 10px !important; border-radius: 999px !important; background: ${pColor}22 !important; border: 1px solid ${pColor}55 !important; color: #fff !important; font-size: 9px !important; line-height: 1 !important; font-weight: 800 !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; position: relative !important; z-index: 10 !important; max-width: 88% !important; overflow: hidden !important; white-space: nowrap !important; }
      .stat-card, .insight-card { background: rgba(255,255,255,0.055) !important; border: 1px solid rgba(255,255,255,0.12) !important; border-radius: 14px !important; padding: 13px !important; position: relative !important; z-index: 10 !important; width: 100% !important; max-width: 100% !important; max-height: 108px !important; overflow: hidden !important; }
      .stat-card *, .insight-card *, .glass-panel *, .console-panel *, .quote-box * { line-height: 1.25 !important; }
      .connector-line { height: 2px !important; background: linear-gradient(90deg, ${pColor}, transparent) !important; border-radius: 999px !important; width: 100% !important; position: relative !important; z-index: 10 !important; }
      .score-row { display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 10px !important; width: 100% !important; padding: 10px 12px !important; border-radius: 12px !important; background: rgba(255,255,255,0.055) !important; border: 1px solid rgba(255,255,255,0.1) !important; position: relative !important; z-index: 10 !important; }
      .score-label { font-size: 11px !important; font-weight: 800 !important; color: rgba(255,255,255,0.86) !important; text-transform: uppercase !important; letter-spacing: 0.06em !important; }
      .score-value { font-size: 22px !important; font-weight: 900 !important; color: ${pColor} !important; line-height: 1 !important; }
      .versus-card { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 10px !important; width: 100% !important; position: relative !important; z-index: 10 !important; }
      .versus-card > div { min-height: 74px !important; padding: 12px !important; border-radius: 14px !important; background: rgba(255,255,255,0.055) !important; border: 1px solid rgba(255,255,255,0.12) !important; overflow: hidden !important; }
      .winner-badge, .status-chip, .menu-tag { display: inline-flex !important; align-items: center !important; width: fit-content !important; max-width: 100% !important; padding: 6px 10px !important; border-radius: 999px !important; background: ${pColor}24 !important; border: 1px solid ${pColor}66 !important; color: #fff !important; font-size: 10px !important; font-weight: 900 !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; position: relative !important; z-index: 10 !important; }
      .metric-strip { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; width: 100% !important; position: relative !important; z-index: 10 !important; }
      .metric-strip > div { padding: 10px 8px !important; border-radius: 12px !important; background: rgba(255,255,255,0.052) !important; border: 1px solid rgba(255,255,255,0.1) !important; overflow: hidden !important; }
      .mini-chart { display: flex !important; align-items: flex-end !important; gap: 7px !important; height: 72px !important; width: 100% !important; padding: 10px !important; border-radius: 14px !important; background: rgba(255,255,255,0.045) !important; border: 1px solid rgba(255,255,255,0.1) !important; position: relative !important; z-index: 10 !important; }
      .mini-chart span { flex: 1 !important; min-width: 0 !important; border-radius: 999px 999px 4px 4px !important; background: linear-gradient(180deg, ${sColor}, ${pColor}) !important; opacity: 0.9 !important; }
      .diagnostic-card, .proof-card, .ui-panel, .quote-note { width: 100% !important; max-height: 120px !important; padding: 14px !important; border-radius: 14px !important; background: rgba(255,255,255,0.055) !important; border: 1px solid rgba(255,255,255,0.12) !important; position: relative !important; z-index: 10 !important; overflow: hidden !important; }
      .checkline, .map-pin-row, .feature-list { display: flex !important; align-items: flex-start !important; gap: 10px !important; width: 100% !important; font-size: 13px !important; line-height: 1.35 !important; color: rgba(255,255,255,0.82) !important; position: relative !important; z-index: 10 !important; }
      .checkline::before, .map-pin-row::before { content: "" !important; width: 7px !important; height: 7px !important; border-radius: 999px !important; background: ${sColor} !important; margin-top: 6px !important; flex-shrink: 0 !important; }
      .funnel-step { display: flex !important; align-items: center !important; gap: 10px !important; width: 100% !important; padding: 10px 12px !important; border-radius: 12px !important; background: rgba(255,255,255,0.052) !important; border-left: 3px solid ${pColor} !important; position: relative !important; z-index: 10 !important; }
      .ingredient-note { width: 100% !important; padding: 12px !important; border-radius: 14px !important; background: rgba(255,255,255,0.04) !important; border: 1px dashed rgba(255,255,255,0.18) !important; font-size: 12px !important; line-height: 1.35 !important; color: rgba(255,255,255,0.78) !important; position: relative !important; z-index: 10 !important; }
      .image-slot { width: 100% !important; height: 82px !important; border-radius: 16px !important; background: linear-gradient(135deg, ${pColor}22, ${sColor}18) !important; border: 1px solid rgba(255,255,255,0.1) !important; position: relative !important; z-index: 10 !important; overflow: hidden !important; }
    `

    let cleanedHtml = currentHtml
    // Strip link tags
    cleanedHtml = cleanedHtml.replace(/<link[^>]*>/g, '')
    // Strip style tags and their contents
    cleanedHtml = cleanedHtml.replace(/<style[^>]*>([\s\S]*?)<\/style>/g, '')
    cleanedHtml = cleanedHtml.trim()

    // Construct the prompt
    const prompt = `
Você é um designer de produto e copywriter especialista em Instagram de altíssimo nível.
O usuário quer fazer um ajuste em um carrossel já gerado.

CÓDIGO HTML ATUAL DO CARROSSEL:
\`\`\`html
${cleanedHtml}
\`\`\`

INSTRUÇÃO DE AJUSTE DO USUÁRIO:
"${instruction}"

ESTILO VISUAL: ${visualTheme}
${themeRules}

IDENTIDADE DA MARCA:
- Nome/Handle: ${brandName}
- Cor Primária: ${pColor}
- Cor Secundária: ${sColor}
- Logo: ${logoUrl ? `usar a imagem ${logoUrl}` : 'sem logo enviada; usar bolinha colorida + nome'}

REGRAS E DIRETRIZES DE AJUSTE:
0. Preserve o sistema de marca do carrossel: tag no topo esquerdo, logo no topo direito, barra de progresso no rodapé, paleta, fontes e motivo gráfico recorrente. Pode variar a composição interna se o usuário pedir mais impacto, mais premium ou menos texto. Não altere proporção, escala, largura, header, rodapé ou estilos globais.
1. Retorne APENAS o código HTML cru e completo do carrossel (todas as divs com classe "ig-slide"). NÃO envolva em blocos Markdown como \`\`\`html.
2. Se a instrução se referir a um slide específico (ex: "mude o título do slide 3" ou "coloque um ícone de alerta no slide 2"), faça a alteração cirurgicamente apenas naquele slide, preservando a coerência visual dos demais slides.
3. Se a instrução for global (ex: "mude o tom de voz para mais descontraído"), aplique de forma homogênea a todos os slides.
4. Mantenha estritamente o layout do Instagram e as classes utilitárias (.ig-slide, .slide-tag, .slide-logo, .slide-logo-dot, .slide-logo-text, .slide-logo-img, .slide-h, .slide-body, .slide-num-bg). Pode usar também .brand-ribbon, .accent-arc, .soft-grid, .kicker-pill, .stat-card, .insight-card, .connector-line, .score-row, .score-label, .score-value, .versus-card, .winner-badge, .metric-strip, .mini-chart, .diagnostic-card, .proof-card, .ui-panel, .quote-note, .status-chip, .menu-tag, .checkline, .map-pin-row, .feature-list, .funnel-step, .ingredient-note e .image-slot.
5. É proibido usar <style> adicional, font-size inline, width inline, transform inline, scale inline, position fixed, position sticky ou classes de largura que alterem a proporção do slide.
6. Todo conteúdo principal deve ficar dentro de <div class="slide-content">. Se o HTML atual tiver .slide-h, .slide-body, .insight-card, .stat-card, .kicker-pill ou CTA soltos fora dessa área, reorganize para dentro dela.
7. Evite bagunça vertical: no máximo 3 filhos diretos dentro de .slide-content; máximo 1 card/painel por slide; corpo com até 16 palavras; card com 1 título curto + 1 frase curta. Não use my-6, my-8, mt-8, mb-8, py-6 ou py-8.
8. Use composição "landing editorial" como padrão: tag e logo bem no topo, conteúdo amplo alinhado à esquerda, poucas linhas e muito espaço negativo. Evite títulos centralizados espremidos. Não insira <br> manual dentro de .slide-h; encurte o texto quando passar de 3 linhas.
9. Ao refinar visualmente, preserve o pack criativo do nicho quando ele estiver claro: streaming/games usa score/versus/ranking; finanças usa métricas/gráficos; saúde usa diagnóstico/checkline; SaaS usa painel/status; marketing usa funil/prova; gastronomia usa menu/ingrediente; moda/luxo usa editorial/quote.
10. Logo obrigatória para este ajuste: ${logoMarkup}. Se houver logo enviada, substitua bolinha + nome por essa imagem e NÃO use .slide-logo-dot nem .slide-logo-text. Se não houver logo enviada, use o fallback bolinha + nome.
11. Se for solicitado um ícone ou marcador, use os SVGs limpos da biblioteca fornecida na geração:
  - Checkmark verde: <svg class="inline-block w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: ${pColor};"><polyline points="20 6 9 17 4 12"></polyline></svg>
  - Alerta/Erro: <svg class="inline-block w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #ef4444;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
  - Dica/Lâmpada: <svg class="inline-block w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #f59e0b;"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line></svg>
`

    // Call Gemini API with fallback
    let response
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.5, // lower temp for adjustments to keep it close to original
        }
      })
    } catch (apiError: any) {
      console.warn('Gemini 2.5 Flash failed, attempting fallback to Gemini 3.1 Flash Lite:', apiError)
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            temperature: 0.5, // lower temp for adjustments to keep it close to original
          }
        })
      } catch (fallbackError: any) {
        console.error('Gemini 3.1 Flash Lite fallback also failed:', fallbackError)
        throw fallbackError
      }
    }

    let updatedHtml = response.text || ''
    
    // Clean up potential markdown formatting from the response
    if (updatedHtml.includes('```html')) {
      updatedHtml = updatedHtml.split('```html')[1].split('```')[0].trim()
    } else if (updatedHtml.includes('```')) {
      updatedHtml = updatedHtml.split('```')[1].split('```')[0].trim()
    }

    const sanitizedUpdatedHtml = sanitizeCarouselSlidesHtml(updatedHtml)
    const finalUpdatedHtml = `${fontHeaderImport}\n<style>\n${themeStyles}\n</style>\n${sanitizedUpdatedHtml}`

    return NextResponse.json({ 
      success: true, 
      html: finalUpdatedHtml 
    })

  } catch (error: any) {
    console.error('Error adjusting carousel:', error)
    return NextResponse.json(
      { error: 'Erro ao ajustar carrossel', details: error.message },
      { status: 500 }
    )
  }
}
