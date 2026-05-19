import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/utils/supabase/server'

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

    // Parse the request body
    const body = await req.json()
    const { currentHtml, instruction, slideIndex, visualTheme = 'Mínimo Moderno', brand } = body

    if (!currentHtml || !instruction) {
      return NextResponse.json({ error: 'HTML atual e instrução são obrigatórios' }, { status: 400 })
    }

    const pColor = brand?.primaryColor || '#7C3AED'
    const sColor = brand?.secondaryColor || '#06B6D4'

    // Dynamic theme rules for adjustment context
    let fontHeaderImport = ''
    let themeStyles = ''
    let themeRules = ''

    if (visualTheme === 'Neon Tech') {
      fontHeaderImport = `<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Share+Tech+Mono&display=swap" rel="stylesheet">`
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
      fontHeaderImport = `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">`
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
      fontHeaderImport = `<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">`
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
- Nome/Handle: ${brand?.name || 'suamarca'}
- Cor Primária: ${pColor}
- Cor Secundária: ${sColor}

REGRAS E DIRETRIZES DE AJUSTE:
1. Retorne APENAS o código HTML cru e completo do carrossel (todas as divs com classe "ig-slide"). NÃO envolva em blocos Markdown como \`\`\`html.
2. Se a instrução se referir a um slide específico (ex: "mude o título do slide 3" ou "coloque um ícone de alerta no slide 2"), faça a alteração cirurgicamente apenas naquele slide, preservando a coerência visual dos demais slides.
3. Se a instrução for global (ex: "mude o tom de voz para mais descontraído"), aplique de forma homogênea a todos os slides.
4. Mantenha estritamente o layout do Instagram e as classes utilitárias (.ig-slide, .slide-tag, .slide-logo, .slide-logo-dot, .slide-logo-text, .slide-h, .slide-body, .slide-num-bg).
5. Se for solicitado um ícone ou marcador, use os SVGs limpos da biblioteca fornecida na geração:
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

    const finalUpdatedHtml = `${fontHeaderImport}\n<style>\n${themeStyles}\n</style>\n${updatedHtml}`

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
