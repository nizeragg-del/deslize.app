import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import { createClient } from '@/utils/supabase/server'

// Extend Vercel serverless function timeout to 60 seconds (Pro plan allows up to 60s)
export const maxDuration = 60

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

    // Render at preview CSS dimensions (360×450) with deviceScaleFactor:3
    // → Puppeteer captures at 1080×1350 natively (360×3 = 1080, 450×3 = 1350)
    const SLIDE_W = 360  // CSS pixels — scales to 1080px at 3x
    const SLIDE_H = 450  // CSS pixels — scales to 1350px at 3x
    const DPR = 3        // devicePixelRatio

    // ── Extract <link> tags (Google Fonts) from html_content ──────────────────
    // The stored html_content starts with font <link> tags baked in at generation time.
    // We pull them out and inject them into <head> where they belong.
    const linkRegex = /<link[^>]*>/gi
    const extractedLinks: string[] = []
    let match
    while ((match = linkRegex.exec(html)) !== null) {
      extractedLinks.push(match[0])
    }
    let cleanedHtml = html.replace(linkRegex, '')

    // ── Extract <style> blocks ────────────────────────────────────────────────
    let extractedStyles = ''
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
    while ((match = styleRegex.exec(cleanedHtml)) !== null) {
      extractedStyles += match[1] + '\n'
    }
    cleanedHtml = cleanedHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

    await page.setViewport({ width: slideCount * SLIDE_W, height: SLIDE_H, deviceScaleFactor: DPR })

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          ${extractedLinks.join('\n          ')}
          <!-- Tailwind CSS Play CDN: compiles all utility classes -->
          <script src="https://cdn.tailwindcss.com"></script>
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
          <style>
            ${extractedStyles}
          </style>
          <style>
            /* Final export lock: keep PNG output aligned with the in-app preview renderer. */
            #track.preview-track { display: flex !important; width: ${slideCount * SLIDE_W}px !important; height: ${SLIDE_H}px !important; }
            #track .ig-slide {
              width: ${SLIDE_W}px !important;
              min-width: ${SLIDE_W}px !important;
              height: ${SLIDE_H}px !important;
              padding: 85px 40px !important;
              position: relative !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: center !important;
              overflow: hidden !important;
              flex-shrink: 0 !important;
            }
            #track .ig-slide * { box-sizing: border-box !important; max-width: 100% !important; }
            #track .slide-tag {
              position: absolute !important;
              top: 40px !important;
              left: 40px !important;
              max-width: 160px !important;
              font-size: 11px !important;
              line-height: 1.2 !important;
              font-weight: 800 !important;
              letter-spacing: 1.5px !important;
              z-index: 20 !important;
            }
            #track .slide-logo {
              position: absolute !important;
              top: 40px !important;
              right: 40px !important;
              display: flex !important;
              align-items: center !important;
              gap: 8px !important;
              max-width: 130px !important;
              z-index: 20 !important;
            }
            #track .slide-logo-dot { width: 16px !important; height: 16px !important; border-radius: 999px !important; flex-shrink: 0 !important; }
            #track .slide-logo-text { font-size: 14px !important; line-height: 1 !important; font-weight: 800 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
            #track .slide-h {
              font-size: 32px !important;
              line-height: 1.08 !important;
              font-weight: 800 !important;
              letter-spacing: 0 !important;
              margin: 0 0 22px !important;
              text-align: center !important;
              position: relative !important;
              z-index: 10 !important;
            }
            #track .slide-body {
              font-size: 16px !important;
              line-height: 1.55 !important;
              text-align: center !important;
              margin: 0 auto !important;
              max-width: 90% !important;
              position: relative !important;
              z-index: 10 !important;
            }
            #track .slide-num-bg { pointer-events: none !important; }
            #track .slide-progress { position: absolute !important; bottom: 40px !important; left: 40px !important; right: 40px !important; z-index: 20 !important; }
          </style>
        </head>
        <body>
          <div class="preview-track" id="track">
            ${cleanedHtml}
          </div>
        </body>
      </html>
    `

    // ── FIX: Use domcontentloaded instead of networkidle0 ────────────────────
    // networkidle0 waits for ALL network activity to stop for 500ms — on Vercel
    // this frequently times out (30s) because Google Fonts CDN keeps connections alive.
    // domcontentloaded is instant; we then wait for fonts separately with a safe timeout.
    page.setDefaultNavigationTimeout(25000)
    await page.setContent(fullHtml, { waitUntil: 'domcontentloaded', timeout: 25000 })

    // Wait for web fonts to load. Use a safe try/catch so a slow CDN doesn't fail the whole export.
    try {
      await Promise.race([
        page.evaluateHandle('document.fonts.ready'),
        new Promise(resolve => setTimeout(resolve, 8000)) // max 8s for fonts
      ])
    } catch (e) {
      console.warn('Font loading check timed out, proceeding with screenshot...', e)
    }

    // Small stabilization delay for Tailwind CDN to parse & apply utility classes
    await new Promise(resolve => setTimeout(resolve, 1200))

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
