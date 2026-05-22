import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { renderCarouselToPngs } from '@/lib/server/carousel-renderer'

export const maxDuration = 60

export async function POST(req: Request) {
  let creditConsumed = false
  let consumedTransactionId: string | null = null
  let refundClient: any = null
  let refundUserId: string | null = null

  try {
    const supabase = await createClient()
    
    // Initialize the SDK inside the request to ensure env variables are populated
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    
    // Validate authentication
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    refundUserId = user.id

    // Initialize admin client to bypass RLS for sensitive mutations
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    refundClient = supabaseAdmin

    // Parse the request body
    const body = await req.json()
    const { topic, format = 'standard', tone = 'profissional', visualTheme = 'Mínimo Moderno', slideCount = 7, brand } = body

    if (!topic) {
      return NextResponse.json({ error: 'O tema (topic) é obrigatório' }, { status: 400 })
    }

    // Dynamic Fonts and CSS Styles based on the theme & Brand Kit properties
    const pColor = brand?.primaryColor || '#7C3AED'
    const sColor = brand?.secondaryColor || '#06B6D4'
    const bgColor = brand?.bgColor || '#0A0A0F'
    const fontDisplay = brand?.fontDisplay || 'Outfit'
    const fontBody = brand?.fontBody || 'Inter'

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
        ESTILO VISUAL SOLICITADO: NEON TECH (Tecnológico, Futurista, Programador)
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
        ESTILO VISUAL SOLICITADO: EDITORIAL ELEGANTE (Premium, Agência, Sofisticado)
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
        ESTILO VISUAL SOLICITADO: MÍNIMO MODERNO (Clean, Startup, Alto Nível)
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
    `

    themeRules += `

DIREÇÃO CRIATIVA AUTORAL:
- Antes de escrever o HTML, escolha mentalmente um território visual específico para esta marca e este tema. Não explique esse raciocínio no retorno.
- O território deve nascer do nicho, público, promessa e tom do brief. Evite qualquer aparência de template genérico.
- Use o ESTILO VISUAL SOLICITADO (${visualTheme}) como direção, não como prisão:
  * Direção Autoral: crie um sistema próprio para a marca usando uma metáfora visual clara.
  * Editorial Premium: use ritmo de revista, títulos sofisticados, respiro e detalhes finos.
  * Social Mockup: use cards sobrepostos, barras, setas, mini componentes sociais e sensação de postagem real.
  * SaaS Visual: use métricas, tabelas compactas, pílulas, painéis e blocos de produto.
  * Manifesto Bold: use tipografia protagonista, frases curtas, contraste forte e poucos elementos.
- Defina um motivo gráfico recorrente: arco, faixa, moldura editorial, linha conectora, bloco lateral, etiqueta, coordenada, índice, mini dashboard ou recorte geométrico.
- Varie a composição dos slides sem quebrar o sistema: capa impactante, slide de tese, slide de prova, slide de passo, slide de contraste, slide de síntese e CTA.
- Não repita a mesma caixa central em todos os slides. Use hierarquia editorial, assimetria controlada e elementos de apoio diferentes por função, mas com no máximo 1 bloco visual principal por slide.
- Nunca empilhe título grande + parágrafo longo + card + pílula no mesmo slide. Escolha título + corpo OU título + card compacto OU pílula + título + CTA curto.
- Use como referência estrutural o carrossel da landing do Deslize: tag e logo bem no topo, conteúdo amplo alinhado à esquerda, muito espaço negativo, barra no rodapé e poucos elementos por slide.
- Não use emojis. Use texto, SVGs fornecidos e formas CSS simples.
`


    const { error: profileInitError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Criador',
        avatar_url: user.user_metadata?.avatar_url,
        plan: 'free',
        credits: 1
      }, { onConflict: 'id', ignoreDuplicates: true })

    if (profileInitError) {
      console.error('Error initializing profile:', profileInitError)
      return NextResponse.json({ error: 'Erro ao inicializar perfil de usuario.' }, { status: 500 })
    }

    const { data: profileBeforeConsume, error: profileBeforeError } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileBeforeError) {
      console.error('Error loading credits before generation:', profileBeforeError)
      return NextResponse.json({ error: 'Erro ao validar saldo de creditos.' }, { status: 500 })
    }

    const creditsBeforeConsume = profileBeforeConsume?.credits ?? 0

    const { data: consumeRows, error: consumeError } = await supabaseAdmin
      .rpc('consume_credit', {
        p_user_id: user.id,
        p_reason: 'carousel_generation'
      })

    if (consumeError) {
      if ((consumeError.message || '').includes('insufficient_credits')) {
        return NextResponse.json({ error: 'Creditos insuficientes. Adquira mais creditos para continuar.' }, { status: 403 })
      }

      console.error('Error consuming credit:', consumeError)
      return NextResponse.json({ error: 'Erro ao consumir credito.' }, { status: 500 })
    }

    const consumedCreditResult = Array.isArray(consumeRows) ? consumeRows[0] : null
    const creditsAfterConsume = consumedCreditResult?.new_credits

    if (typeof creditsAfterConsume !== 'number' || creditsAfterConsume >= creditsBeforeConsume) {
      console.error('Credit consumption did not reduce balance:', {
        userId: user.id,
        creditsBeforeConsume,
        creditsAfterConsume
      })

      return NextResponse.json(
        { error: 'Erro ao debitar credito. Tente novamente em alguns instantes.' },
        { status: 500 }
      )
    }

    creditConsumed = true
    consumedTransactionId = consumedCreditResult?.transaction_id ?? null
    // Construct the prompt
    const prompt = `
Você é um designer de produto e copywriter especialista em Instagram de altíssimo nível.
Sua missão é gerar o conteúdo HTML de um carrossel de alta conversão usando as melhores práticas de design.

TEMA PRINCIPAL: "${topic}"
FORMATO DE CONTEÚDO: ${format}
TOM DE VOZ: ${tone}
NÚMERO DE SLIDES: ${slideCount}
ESTILO VISUAL SOLICITADO: ${visualTheme}

IDENTIDADE DA MARCA:
- Nome/Handle: ${brand?.name || 'suamarca'}
- Cor Primária (Destaques e Acentos): ${pColor}
- Cor Secundária: ${sColor}

${themeRules}

FONTES E ESTILOS GLOBAIS ENVIADOS NO HEAD:
${fontHeaderImport}

REGRAS DE CONTEXTO E FLUXO:
0. CONSISTÊNCIA VISUAL OBRIGATÓRIA:
   - Todos os slides devem seguir o mesmo sistema de marca: tag no topo esquerdo, logo no topo direito, barra de progresso no rodapé, paleta, fontes e motivo gráfico recorrente.
   - Varie a composição interna conforme a função de cada slide. Pode usar alinhamento central, editorial assimétrico, blocos laterais, mini cards, linhas conectoras e números grandes.
   - Não crie layouts estreitos, não use mockups externos, não altere a proporção 4:5 e não use uma caixa central repetida como solução padrão em todos os slides.
   - A composição padrão deve ser "landing editorial": tag e logo no topo, conteúdo principal alinhado à esquerda, largura ampla, sem bloco espremido no centro.
   - Use a identidade da marca enviada apenas neste momento de geração. Depois de salvo, este carrossel deve continuar com estas cores e fontes mesmo que o Brand Kit mude no futuro.
1. O primeiro slide (Slide 1 - Hero/Hook) deve ser limpo e elegante:
   - O título deve ser direto e usar APENAS a classe .slide-h. É ESTRITAMENTE PROIBIDO usar classes Tailwind de tamanho de fonte (ex: text-5xl, text-6xl, text-7xl, text-huge) no título ou em qualquer texto. Deixe o CSS padrão controlar o tamanho para evitar sobreposições que quebram o layout.
   - Envolva as palavras-chave mais impactantes em tags <span class="gradient-span"> para aplicar o gradiente brilhante da marca.
   - Use uma distribuição limpa, deixando espaço para o texto respirar e posicionando dois glows ambientais distantes (ex: um no topo esquerdo e um no canto inferior direito) para dar um efeito de iluminação volumétrica sofisticada de fundo.
   - NÃO use parágrafos longos ou genéricos de corpo no Slide 1; no máximo uma linha curta ou subtítulo elegante e direto de apoio (ex: "Descubra como em 3 passos rápidos.").
2. SLIDES CONCISOS (MUITO IMPORTANTE): A área útil vertical do carrossel é EXTREMAMENTE PEQUENA (aprox. 360x450 dentro do mockup). Se você gerar parágrafos longos, muitos bullet points, ou empilhar vários elementos visuais no mesmo slide, o conteúdo VAZARÁ e será CORTADO no rodapé. Divida conteúdos maiores em múltiplos slides ao invés de encher um só.
   - Título: máximo 38 caracteres ou 3 linhas visuais. Se o tema for longo, resuma o título e deixe detalhes para o corpo.
   - Corpo: máximo 16 palavras por .slide-body.
   - Card: máximo 1 título curto + 1 frase de até 12 palavras.
   - Use no máximo 1 card/painel por slide. Em comparação, use 2 mini cards sem parágrafo adicional.
3. Mantenha o mesmo padrão visual entre os slides. Pode variar o texto e pequenos blocos internos, mas preserve tipografia, espaçamento, header, rodapé e uma área central segura.
4. O último slide DEVE conter um CTA marcante (ex: "Salve este post para ler depois" ou "Compartilhe com um amigo") acompanhado do logotipo da marca.

REGRAS DE CÓDIGO HTML (MUITO IMPORTANTE):
- Retorne APENAS o código HTML cru das divs de slide. NÃO envolva em tags de bloco Markdown como \`\`\`html.
- Cada slide deve ser uma div com a classe "ig-slide" consecutiva.
- É proibido usar <style> adicional dentro dos slides. Use apenas as classes e componentes listados.
- É proibido usar font-size inline, width inline, transform inline, scale inline, position fixed, position sticky, min-width personalizado ou classes de largura que alterem a proporção do slide.
- Evite inserir <br> manual dentro de .slide-h. Deixe o CSS quebrar o texto naturalmente. Use <span class="gradient-span"> apenas em 1 a 3 palavras.
- Mantenha estritamente estas classes utilitárias no seu HTML para compatibilidade com o leitor:
  * Contêiner do slide: <div class="ig-slide">
  * Tag de topo: <div class="slide-tag">SUA TAG</div>
  * Logo da marca: <div class="slide-logo"><div class="slide-logo-dot" style="background-color: ${pColor}"></div><span class="slide-logo-text">${brand?.name || 'suamarca'}</span></div>
  * Título do slide: <div class="slide-h title-font">...</div>
  * Texto de corpo: <div class="slide-body body-font">...</div>
  * Número de fundo gigante (opcional): <div class="slide-num-bg">1</div>
  * Área útil obrigatória: <div class="slide-content">...conteúdo principal...</div>
  * Componentes profissionais opcionais: .brand-ribbon, .accent-arc, .soft-grid, .kicker-pill, .stat-card, .insight-card, .connector-line

ESTRUTURA OBRIGATÓRIA DE CADA SLIDE:
<div class="ig-slide">
  <div class="slide-tag">...</div>
  <div class="slide-logo"><div class="slide-logo-dot" style="background-color: ${pColor}"></div><span class="slide-logo-text">${brand?.name || 'suamarca'}</span></div>
  <div class="slide-content">
    ...somente o conteúdo principal do slide...
  </div>
  <div class="slide-progress">...</div>
</div>

Dentro de .slide-content, use no máximo 3 filhos diretos. Exemplo seguro:
<div class="slide-content">
  <div class="kicker-pill">DICA PRO</div>
  <div class="slide-h title-font">Título curto e forte</div>
  <div class="insight-card"><div class="font-bold text-sm mb-1">Insight</div><div class="text-xs text-white/70">Frase curta e direta.</div></div>
</div>

⚠️ ZONA DO CABEÇALHO — REGRA CRÍTICA ANTI-SOBREPOSIÇÃO:
Os elementos .slide-tag e .slide-logo são posicionados ABSOLUTAMENTE no topo do slide (top: 40px).
O conteúdo flexível (.slide-h, .slide-body, etc.) é centralizado verticalmente — se o conteúdo for alto, ele pode subir e SOBREPOR o cabeçalho.
Para EVITAR isso, todo conteúdo principal deve ficar dentro de <div class="slide-content">. Nunca coloque .slide-h, .slide-body, .insight-card, .stat-card, .kicker-pill ou CTA soltos fora de .slide-content.
NUNCA deixe o título ou qualquer conteúdo visualmente sobrepor o .slide-logo, .slide-tag ou a barra inferior.

⚠️ ZONA DO RODAPÉ — PREVENÇÃO CONTRA CORTE DE TEXTO:
Assim como o topo, a parte inferior do slide possui uma barra de progresso (bottom: 40px). 
Você NUNCA deve estourar o limite de conteúdo vertical do slide. Para isso, mantenha as mensagens diretas e NÃO acumule textos no corpo. É proibido colocar pílulas, badges ou cards depois de um bloco grande se isso empurrar o conteúdo para o rodapé. Se o texto for grande, crie outro slide para continuá-lo.
Não use classes Tailwind de margem vertical grande como my-6, my-8, mt-8, mb-8, py-6 ou py-8 dentro dos slides.

⚠️ TAMANHO DE FONTES — REGRA CRÍTICA ANTI-SOBREPOSIÇÃO:
É ABSOLUTAMENTE PROIBIDO o uso de classes utilitárias de tamanho de fonte do Tailwind (como text-4xl, text-5xl, text-6xl, text-7xl, text-8xl) em títulos ou textos de corpo. 
O uso dessas classes faz com que o texto fique gigante e sobreponha o logotipo e o rodapé do slide. 
NUNCA use font-size inline.
Apenas aplique a classe ".slide-h" e deixe o CSS nativo definir o tamanho perfeito (32px).
Se precisar de texto menor, use apenas text-sm ou text-xs.

BIBLIOTECA DE ÍCONES (Use estes SVGs limpos no lugar de emojis ou marcadores genéricos):
- Checkmark verde/marca: <svg class="inline-block w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: ${pColor};"><polyline points="20 6 9 17 4 12"></polyline></svg>
- Alerta/Erro: <svg class="inline-block w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #ef4444;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
- Dica/Lâmpada: <svg class="inline-block w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #f59e0b;"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line></svg>
- Seta direita: <svg class="inline-block w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: ${pColor};"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>

LAYOUTS EXEMPLARES PARA UTILIZAR NOS SLIDES DO MEIO:
- Exemplo de Glassmorphism Box:
  <div class="glass-panel text-white">
    <div class="font-bold text-sm mb-1">Título do Destaque</div>
    <div class="text-xs text-white/70">Texto explicativo refinado.</div>
  </div>
- Exemplo de Métrica de Dados (Número Gigante):
  <div class="flex flex-col items-center justify-center my-4">
    <div class="slide-h title-font"><span class="gradient-span">+147%</span></div>
    <div class="text-xs text-white/60 uppercase tracking-widest mt-1">Aumento de Engajamento</div>
  </div>
- Exemplo de Grid Lado a Lado (Comparação):
  <div class="grid grid-cols-2 gap-3 my-2">
    <div class="p-3 rounded-xl border border-red-500/20 bg-red-500/5">
      <div class="font-bold text-red-400 text-xs uppercase mb-1">Errado</div>
      <div class="text-[11px] text-white/70">Texto descrevendo o erro comum.</div>
    </div>
    <div class="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
      <div class="font-bold text-emerald-400 text-xs uppercase mb-1">Certo</div>
      <div class="text-[11px] text-white/70">A solução elegante recomendada.</div>
    </div>
  </div>

Certifique-se de retornar exatamente ${slideCount} slides válidos. Mantenha os estilos inline limpos e adequados para cores em contraste com fundos escuros.
`

    // Call Gemini API with fallback
    let response
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      })
    } catch (apiError: any) {
      console.warn('Gemini 2.5 Flash failed, attempting fallback to Gemini 3.1 Flash Lite:', apiError)
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            temperature: 0.7,
          }
        })
      } catch (fallbackError: any) {
        console.error('Gemini 3.1 Flash Lite fallback also failed:', fallbackError)
        throw fallbackError
      }
    }

    let htmlContent = response.text || ''
    
    // Clean up potential markdown formatting from the response
    if (htmlContent.includes('```html')) {
      htmlContent = htmlContent.split('```html')[1].split('```')[0].trim()
    } else if (htmlContent.includes('```')) {
      htmlContent = htmlContent.split('```')[1].split('```')[0].trim()
    }

    const finalHtml = `${fontHeaderImport}\n<style>\n${themeStyles}\n</style>\n${htmlContent}`

    // Save the carousel to public.carousels
    const { data: carousel, error: carouselInsertError } = await supabase
      .from('carousels')
      .insert({
        user_id: user.id,
        title: topic,
        topic: topic,
        format: format,
        slide_count: slideCount,
        html_content: finalHtml,
        status: 'ready',
        credits_used: 1
      })
      .select('id')
      .single()

    if (carouselInsertError) {
      console.error('Error saving carousel to database:', carouselInsertError)
      throw carouselInsertError
    }

    if (consumedTransactionId && carousel?.id) {
      const { error: txUpdateError } = await supabaseAdmin
        .from('credit_transactions')
        .update({ carousel_id: carousel.id })
        .eq('id', consumedTransactionId)

      if (txUpdateError) {
        console.error('Error linking credit transaction to carousel:', txUpdateError)
      }
    }

    let slideUrls: string[] = []
    if (carousel?.id) {
      try {
        slideUrls = await renderCarouselToPngs({
          supabase: supabaseAdmin,
          userId: user.id,
          carouselId: carousel.id,
          html: finalHtml,
          slideCount
        })
      } catch (renderError) {
        console.error('Error rendering canonical carousel PNGs:', renderError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      html: finalHtml,
      carouselId: carousel?.id || null,
      slideUrls
    })

  } catch (error: any) {
    console.error('Error generating carousel:', error)

    if (creditConsumed && refundClient && refundUserId) {
      const { error: refundError } = await refundClient
        .rpc('refund_credit', {
          p_user_id: refundUserId,
          p_reason: 'carousel_generation_failed'
        })

      if (refundError) {
        console.error('Error refunding failed carousel generation:', refundError)
      }
    }

    return NextResponse.json(
      { error: 'Erro ao gerar carrossel', details: error.message },
      { status: 500 }
    )
  }
}
