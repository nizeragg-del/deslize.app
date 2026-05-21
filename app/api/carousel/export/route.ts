import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { html, slideCount = 7, carouselId } = await req.json()

    if (!html) {
      return NextResponse.json({ error: 'HTML é obrigatório' }, { status: 400 })
    }

    const browserlessUrl = process.env.BROWSERLESS_URL

    if (!browserlessUrl) {
      console.warn('BROWSERLESS_URL não configurado, retornando URLs de testes')
      const mockUrls = Array.from({ length: slideCount }).map(
        (_, i) => `https://placehold.co/1080x1350/7C3AED/FFFFFF.png?text=Slide+${i + 1}`
      )
      return NextResponse.json({ success: true, urls: mockUrls })
    }

    const browser = await puppeteer.connect({
      browserWSEndpoint: browserlessUrl,
    })

    const page = await browser.newPage()

    // KEY FIX: Render at preview CSS dimensions (360×450) with deviceScaleFactor:3
    // → Puppeteer captures at 1080×1350 natively (360×3 = 1080, 450×3 = 1350)
    // This eliminates ALL font-size/layout inconsistencies because the AI-generated HTML
    // renders at the SAME CSS pixel dimensions as the in-app preview. Inline styles,
    // font sizes, and Tailwind classes all behave identically to what the user sees.
    const SLIDE_W = 360  // CSS pixels — scales to 1080px at 3x
    const SLIDE_H = 450  // CSS pixels — scales to 1350px at 3x
    const DPR = 3        // devicePixelRatio: 360 * 3 = 1080, 450 * 3 = 1350

    await page.setViewport({ width: slideCount * SLIDE_W, height: SLIDE_H, deviceScaleFactor: DPR })

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=Share+Tech+Mono:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
          <!-- Tailwind CSS Play CDN: compiles all utility classes (w-5, h-5, rounded-2xl, inline-flex, grid, etc.) -->
          <script src="https://cdn.tailwindcss.com"><\/script>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; background: #0A0A0F; color: white; font-family: sans-serif; }
            /* Prevent SVG icons from overflowing their container */
            svg { max-width: 100%; max-height: 100%; display: inline-block; }
            /* Preview-scale base styles — identical to the in-app preview CSS */
            .preview-track { display: flex; width: ${slideCount * SLIDE_W}px; height: ${SLIDE_H}px; }
            .ig-slide {
              width: ${SLIDE_W}px; height: ${SLIDE_H}px;
              padding: 40px; padding-top: 85px; padding-bottom: 85px;
              position: relative; display: flex; flex-direction: column;
              justify-content: center; overflow: hidden; flex-shrink: 0;
            }
            .slide-tag { position: absolute; top: 40px; left: 40px; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: 2px; text-transform: uppercase; }
            .slide-logo { position: absolute; top: 40px; right: 40px; display: flex; align-items: center; gap: 8px; }
            .slide-logo-dot { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; }
            .slide-logo-text { font-size: 14px; font-weight: 700; letter-spacing: -0.5px; }
            .slide-num-bg { position: absolute; bottom: 0; right: 0; font-family: inherit; font-size: 240px; font-weight: 800; color: rgba(255,255,255,0.03); line-height: 0.8; pointer-events: none; }
            .slide-h { font-family: inherit; font-weight: 800; line-height: 1.1; margin-bottom: 24px; position: relative; z-index: 10; font-size: 32px; }
            .slide-body { font-size: 16px; color: rgba(255,255,255,0.7); line-height: 1.6; max-width: 90%; position: relative; z-index: 10; }
            .slide-progress { position: absolute; bottom: 40px; left: 40px; right: 40px; display: flex; align-items: center; gap: 16px; }
            .progress-track { flex: 1; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
            .progress-fill { height: 100%; background: white; border-radius: 2px; }
            .progress-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); white-space: nowrap; }
          </style>
        </head>
        <body>
          <div class="preview-track" id="track">
            ${html}
          </div>
        </body>
      </html>
    `

    // waitUntil 'networkidle0': waits for Tailwind CDN script and Google Fonts to fully load and have no more network activity
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' as any })

    // Ensure all web fonts are fully downloaded and decoded
    await page.evaluateHandle('document.fonts.ready')

    // Stabilization delay: lets Tailwind Play CDN parse the DOM and compile utility classes
    await new Promise(resolve => setTimeout(resolve, 800))

    const uploadedUrls: string[] = []

    for (let i = 0; i < slideCount; i++) {
      // Clip in CSS pixels — deviceScaleFactor:3 automatically scales output to 1080×1350
      const clip = {
        x: i * SLIDE_W,
        y: 0,
        width: SLIDE_W,
        height: SLIDE_H
      }

      const screenshotBuffer = await page.screenshot({ 
        clip,
        type: 'png'
      })

      const fileName = `${user.id}/${carouselId || 'temp'}/slide_${i + 1}.png`
      
      const { data, error: uploadError } = await supabase.storage
        .from('slides')
        .upload(fileName, screenshotBuffer, {
          contentType: 'image/png',
          upsert: true
        })

      if (uploadError) {
        console.error(`Error uploading slide ${i}:`, uploadError)
        throw uploadError
      }

      const { data: signedUrlData } = await supabase.storage
        .from('slides')
        .createSignedUrl(fileName, 60 * 60 * 24)

      if (signedUrlData?.signedUrl) {
        uploadedUrls.push(signedUrlData.signedUrl)
      }
    }

    await browser.close()

    return NextResponse.json({
      success: true,
      urls: uploadedUrls
    })

  } catch (error: any) {
    console.error('Error exporting carousel:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao exportar carrossel para PNG' },
      { status: 500 }
    )
  }
}
