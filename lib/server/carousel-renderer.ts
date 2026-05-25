import puppeteer from 'puppeteer-core'
import { isPrivateOrLocalHostname } from '@/lib/server/input-safety'

type SupabaseLike = {
  storage: any
  from: (table: string) => any
}

const CAROUSEL_SLIDES_BUCKET = 'carousel-slides'

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
    if (process.env.NODE_ENV === 'production') {
      throw new Error('BROWSERLESS_URL is required to render carousel PNGs in production')
    }

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
    await page.setJavaScriptEnabled(false)
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      const url = request.url()
      const resourceType = request.resourceType()

      if (resourceType === 'document' || url.startsWith('data:') || url.startsWith('blob:')) {
        request.continue()
        return
      }

      try {
        const parsedUrl = new URL(url)
        const host = parsedUrl.hostname
        const allowedHosts = [
          'fonts.googleapis.com',
          'fonts.gstatic.com',
          'api.dicebear.com',
        ]
        const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
          ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
          : ''

        if (
          allowedHosts.includes(host) ||
          host === supabaseHost ||
          (resourceType === 'image' && parsedUrl.protocol === 'https:' && !isPrivateOrLocalHostname(host))
        ) {
          request.continue()
          return
        }
      } catch {
        // Fall through to abort malformed URLs.
      }

      request.abort()
    })
    await page.setViewport({ width: SLIDE_W, height: SLIDE_H, deviceScaleFactor: DPR })

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          ${extractedLinks.join('\n          ')}
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
            .flex { display: flex; }
            .inline-block { display: inline-block; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .flex-col { flex-direction: column; }
            .items-center { align-items: center; }
            .justify-center { justify-content: center; }
            .gap-3 { gap: 0.75rem; }
            .gap-6 { gap: 1.5rem; }
            .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
            .my-4 { margin-top: 1rem; margin-bottom: 1rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mb-1 { margin-bottom: 0.25rem; }
            .ml-1 { margin-left: 0.25rem; }
            .mr-2 { margin-right: 0.5rem; }
            .p-3 { padding: 0.75rem; }
            .rounded-xl { border-radius: 0.75rem; }
            .border { border-width: 1px; border-style: solid; }
            .border-red-500\/20 { border-color: rgba(239,68,68,0.2); }
            .border-emerald-500\/20 { border-color: rgba(16,185,129,0.2); }
            .bg-red-500\/5 { background-color: rgba(239,68,68,0.05); }
            .bg-emerald-500\/5 { background-color: rgba(16,185,129,0.05); }
            .font-bold { font-weight: 700; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-xs { font-size: 0.75rem; line-height: 1rem; }
            .text-\[11px\] { font-size: 11px; line-height: 1rem; }
            .text-white { color: #fff; }
            .text-white\/60 { color: rgba(255,255,255,0.6); }
            .text-white\/70 { color: rgba(255,255,255,0.7); }
            .text-red-400 { color: #f87171; }
            .text-emerald-400 { color: #34d399; }
            .uppercase { text-transform: uppercase; }
            .tracking-widest { letter-spacing: 0.1em; }
            .w-4 { width: 1rem; }
            .h-4 { height: 1rem; }
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
    const slideRows: Array<{
      carousel_id: string
      slide_index: number
      storage_path: string
      storage_bucket: string
      width: number
      height: number
    }> = []

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
        .from(CAROUSEL_SLIDES_BUCKET)
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
        storage_bucket: CAROUSEL_SLIDES_BUCKET,
        width: 1080,
        height: 1350
      })

      const { data: signedUrlData } = await supabase.storage
        .from(CAROUSEL_SLIDES_BUCKET)
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
