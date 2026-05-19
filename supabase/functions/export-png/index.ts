import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import puppeteer from "npm:puppeteer-core@22.7.1"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authenticate user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { html, slideCount = 7, carouselId } = await req.json()

    if (!html) {
      return new Response(JSON.stringify({ error: 'HTML is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Connect to Headless Browser (e.g. Browserless.io)
    const browserlessUrl = Deno.env.get('BROWSERLESS_URL')
    
    // For demo purposes, if browserless is not configured, we'll return a mock URL
    if (!browserlessUrl) {
      console.log('BROWSERLESS_URL not configured, returning mock URLs')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Mock export (Browserless not configured)",
          urls: Array.from({length: slideCount}).map((_, i) => `https://placehold.co/1080x1350/7C3AED/FFFFFF.png?text=Slide+${i+1}`)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const browser = await puppeteer.connect({
      browserWSEndpoint: browserlessUrl,
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1080, height: 1350 })

    // Inject HTML into the page. 
    // We add a wrapper to ensure each slide is positioned correctly for screenshots
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

    await page.setContent(fullHtml, { waitUntil: 'networkidle0' })

    const uploadedUrls = []
    
    // Setup Supabase service role for storage upload
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Take screenshot of each slide
    for (let i = 0; i < slideCount; i++) {
      // Create a clip for the specific slide area
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

      // Upload to Supabase Storage
      const fileName = `${user.id}/${carouselId || 'temp'}/slide_${i + 1}.png`
      
      const { data, error } = await supabaseAdmin.storage
        .from('slides')
        .upload(fileName, screenshotBuffer, {
          contentType: 'image/png',
          upsert: true
        })

      if (error) {
        console.error(`Error uploading slide ${i}:`, error)
        throw error
      }

      // Get signed URL (valid for 24 hours)
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from('slides')
        .createSignedUrl(fileName, 60 * 60 * 24)

      if (signedUrlData) {
        uploadedUrls.push(signedUrlData.signedUrl)
      }
    }

    await browser.close()

    return new Response(
      JSON.stringify({ 
        success: true, 
        urls: uploadedUrls 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    console.error('Error in export-png:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
