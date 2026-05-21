import puppeteer from 'puppeteer-core'

type SupabaseLike = {
  storage: any
  from: (table: string) => any
}

export async function renderCarouselToPngs({
  supabase,
  userId,
  carouselId,
  html,
  slideCount = 7
}: {
  supabase: SupabaseLike
  userId: string
  carouselId: string
  html: string
  slideCount?: number
}) {
  const browserlessUrl = process.env.BROWSERLESS_URL

  if (!browserlessUrl) {
    console.warn('BROWSERLESS_URL nao configurado, retornando URLs de teste')
    return Array.from({ length: slideCount }).map(
      (_, i) => `https://placehold.co/1080x1350/7C3AED/FFFFFF.png?text=Slide+${i + 1}`
    )
  }

  const SLIDE_W = 360
  const SLIDE_H = 450
  const DPR = 3

  const linkRegex = /<link[^>]*>/gi
  const extractedLinks: string[] = []
  let match
  while ((match = linkRegex.exec(html)) !== null) {
    extractedLinks.push(match[0])
  }
  let cleanedHtml = html.replace(linkRegex, '')

  let extractedStyles = ''
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
  while ((match = styleRegex.exec(cleanedHtml)) !== null) {
    extractedStyles += `${match[1]}\n`
  }
  cleanedHtml = cleanedHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

  const browser = await puppeteer.connect({
    browserWSEndpoint: browserlessUrl,
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: SLIDE_W, height: SLIDE_H, deviceScaleFactor: DPR })

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          ${extractedLinks.join('\n          ')}
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; background: #0A0A0F; color: white; font-family: sans-serif; }
            svg { max-width: 100%; max-height: 100%; display: inline-block; }
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
          <style>${extractedStyles}</style>
          <style>
            html, body, #stage {
              width: ${SLIDE_W}px !important;
              height: ${SLIDE_H}px !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              background: transparent !important;
            }
            #source {
              display: none !important;
            }
            #stage > .ig-slide {
              width: ${SLIDE_W}px !important;
              min-width: ${SLIDE_W}px !important;
              max-width: ${SLIDE_W}px !important;
              height: ${SLIDE_H}px !important;
              min-height: ${SLIDE_H}px !important;
              max-height: ${SLIDE_H}px !important;
              flex: 0 0 ${SLIDE_W}px !important;
              margin: 0 !important;
              transform: none !important;
            }
          </style>
        </head>
        <body>
          <div id="stage"></div>
          <div id="source">${cleanedHtml}</div>
        </body>
      </html>
    `

    page.setDefaultNavigationTimeout(25000)
    await page.setContent(fullHtml, { waitUntil: 'domcontentloaded', timeout: 25000 })

    try {
      await Promise.race([
        page.evaluateHandle('document.fonts.ready'),
        new Promise(resolve => setTimeout(resolve, 8000))
      ])
    } catch (error) {
      console.warn('Font loading check timed out, proceeding with screenshot...', error)
    }

    await new Promise(resolve => setTimeout(resolve, 1200))

    const uploadedUrls: string[] = []
    const slideRows: Array<{ carousel_id: string; slide_index: number; storage_path: string; width: number; height: number }> = []

    for (let i = 0; i < slideCount; i++) {
      const hasSlide = await page.evaluate((index) => {
        const stage = document.getElementById('stage')
        const source = document.getElementById('source')
        const slides = Array.from(source?.querySelectorAll('.ig-slide') ?? [])
        const slide = slides[index] as HTMLElement | undefined

        if (!stage || !slide) {
          return false
        }

        stage.innerHTML = slide.outerHTML
        return true
      }, i)

      if (!hasSlide) {
        console.warn(`Slide ${i + 1} nao encontrado no HTML renderizado`)
        continue
      }

      const screenshotBuffer = await page.screenshot({
        clip: { x: 0, y: 0, width: SLIDE_W, height: SLIDE_H },
        type: 'png'
      })

      const fileName = `${userId}/${carouselId}/slide_${i + 1}.png`

      const { error: uploadError } = await supabase.storage
        .from('slides')
        .upload(fileName, screenshotBuffer, {
          contentType: 'image/png',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      slideRows.push({
        carousel_id: carouselId,
        slide_index: i,
        storage_path: fileName,
        width: 1080,
        height: 1350
      })

      const { data: signedUrlData } = await supabase.storage
        .from('slides')
        .createSignedUrl(fileName, 60 * 60 * 24)

      if (signedUrlData?.signedUrl) {
        uploadedUrls.push(signedUrlData.signedUrl)
      }
    }

    await supabase.from('slides').delete().eq('carousel_id', carouselId)
    if (slideRows.length > 0) {
      const { error: insertError } = await supabase.from('slides').insert(slideRows)
      if (insertError) {
        console.error('Error recording rendered slide rows:', insertError)
      }
    }

    return uploadedUrls
  } finally {
    await browser.close()
  }
}
