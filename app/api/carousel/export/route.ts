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
    await page.setViewport({ width: 1080, height: 1350 })

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; padding: 0; background: #0A0A0F; color: white; font-family: sans-serif; }
            .preview-track { display: flex; width: ${slideCount * 1080}px; height: 1350px; }
            .ig-slide { width: 1080px; height: 1350px; padding: 120px; position: relative; display: flex; flex-direction: column; justify-content: center; overflow: hidden; flex-shrink: 0; box-sizing: border-box; }
            .slide-tag { position: absolute; top: 120px; left: 120px; font-size: 33px; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: 6px; }
            .slide-logo { position: absolute; top: 120px; right: 120px; display: flex; align-items: center; gap: 24px; }
            .slide-logo-dot { width: 48px; height: 48px; border-radius: 50%; }
            .slide-logo-text { font-size: 42px; font-weight: 700; letter-spacing: -1.5px; }
            .slide-num-bg { position: absolute; bottom: 0; right: 0; font-family: 'Space Grotesk', sans-serif; font-size: 720px; font-weight: 800; color: rgba(255,255,255,0.03); line-height: 0.8; }
            .slide-h { font-family: 'Space Grotesk', sans-serif; font-weight: 800; line-height: 1.1; margin-bottom: 72px; position: relative; z-index: 10; font-size: 96px;}
            .slide-body { font-size: 48px; color: rgba(255,255,255,0.7); line-height: 1.6; max-width: 90%; position: relative; z-index: 10; }
            .slide-progress { position: absolute; bottom: 120px; left: 120px; right: 120px; display: flex; align-items: center; gap: 48px; }
            .progress-track { flex: 1; height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden; }
            .progress-fill { height: 100%; background: white; border-radius: 6px; }
            .progress-label { font-size: 36px; font-weight: 600; color: rgba(255,255,255,0.5); }
          </style>
        </head>
        <body>
          <div class="preview-track" id="track">
            ${html}
          </div>
        </body>
      </html>
    `

    await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' })

    const uploadedUrls: string[] = []

    for (let i = 0; i < slideCount; i++) {
      const clip = {
        x: i * 1080,
        y: 0,
        width: 1080,
        height: 1350
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
