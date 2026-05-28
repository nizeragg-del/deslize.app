type VisualAsset = {
  url: string
  query: string
  photographer?: string
  sourceUrl?: string
  alt: string
}

type VisualAssetInput = {
  brandName: string
  niche: string
  topic: string
  packId: string
  userId: string
  carouselId?: string
  supabase: any
}

const VISUAL_ASSET_BUCKET = 'brand-assets'
const IMAGE_FRIENDLY_PACKS = new Set(['diagnostic-clean', 'menu-editorial', 'moodboard-premium', 'location-guide'])

const queryRules: Array<[RegExp, string[]]> = [
  [/salao|cabelo|barbearia|corte|visagismo|beleza/i, ['premium hair salon interior portrait', 'hair stylist cutting hair close up', 'luxury beauty salon detail']],
  [/gastronomia|restaurante|delivery|hamburg|comida|food|brasa|pizza/i, ['artisan burger close up dark background', 'restaurant food plating close up', 'grill flame restaurant food']],
  [/imobiliario|bairro|apartamento|turismo|evento|local|rota/i, ['modern apartment building exterior', 'cozy apartment interior portrait', 'city neighborhood street premium']],
  [/moda|look|luxo|estilo|atelier/i, ['premium fashion detail portrait', 'luxury fabric texture editorial', 'fashion atelier close up']],
  [/clinica|saude|odont|estetica|terapia/i, ['premium clinic interior portrait', 'modern dental clinic detail', 'aesthetic clinic treatment room']],
]

function normalizeQuery(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function shouldUseExternalImages(input: VisualAssetInput) {
  const text = normalizeQuery(`${input.niche} ${input.topic}`)
  if (/(sem foto|sem imagem|apenas texto|somente texto|no image)/i.test(text)) return false
  if (IMAGE_FRIENDLY_PACKS.has(input.packId)) return true
  return /(restaurante|delivery|hamburg|salao|cabelo|barbearia|beleza|moda|imovel|apartamento|turismo|clinica|estetica)/i.test(text)
}

function buildQueries(input: VisualAssetInput) {
  const source = `${input.niche} ${input.topic}`
  const matchedQueries = queryRules.find(([pattern]) => pattern.test(source))?.[1] || []
  const nicheQuery = normalizeQuery(source).split(' ').slice(0, 6).join(' ')
  return [...matchedQueries, nicheQuery].filter(Boolean).slice(0, 3)
}

function extensionFromContentType(contentType: string) {
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('png')) return 'png'
  return 'jpg'
}

async function uploadPexelsImage(input: VisualAssetInput, imageUrl: string, index: number) {
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) return ''

  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(contentType)) return ''

  const bytes = Buffer.from(await imageResponse.arrayBuffer())
  if (bytes.length > 5 * 1024 * 1024) return ''

  const ext = extensionFromContentType(contentType)
  const safeBrand = normalizeQuery(input.brandName).replace(/\s+/g, '-').slice(0, 36) || 'brand'
  const namespace = input.carouselId || `${Date.now()}`
  const path = `${input.userId}/carousel_visuals/${namespace}/${safeBrand}_${index + 1}.${ext}`

  const { error } = await input.supabase.storage
    .from(VISUAL_ASSET_BUCKET)
    .upload(path, bytes, {
      contentType,
      upsert: true,
    })

  if (error) {
    console.error('Error uploading visual asset:', error)
    return ''
  }

  return input.supabase.storage.from(VISUAL_ASSET_BUCKET).getPublicUrl(path).data.publicUrl || ''
}

export async function getCarouselVisualAssets(input: VisualAssetInput): Promise<VisualAsset[]> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey || !shouldUseExternalImages(input)) return []

  const queries = buildQueries(input)
  const assets: VisualAsset[] = []
  const seenPhotoIds = new Set<number>()

  for (const query of queries) {
    if (assets.length >= 2) break

    try {
      const searchUrl = new URL('https://api.pexels.com/v1/search')
      searchUrl.searchParams.set('query', query)
      searchUrl.searchParams.set('orientation', 'portrait')
      searchUrl.searchParams.set('per_page', '4')
      searchUrl.searchParams.set('locale', 'en-US')

      const response = await fetch(searchUrl, {
        headers: { Authorization: apiKey },
        next: { revalidate: 60 * 60 * 24 },
      })

      if (!response.ok) {
        console.warn('Pexels search failed:', response.status, await response.text().catch(() => ''))
        continue
      }

      const data = await response.json()
      const photos = Array.isArray(data?.photos) ? data.photos : []
      const photo = photos.find((item: any) => item?.id && !seenPhotoIds.has(item.id) && item?.src?.large2x)
      if (!photo) continue

      seenPhotoIds.add(photo.id)
      const publicUrl = await uploadPexelsImage(input, photo.src.large2x || photo.src.large, assets.length)
      if (!publicUrl) continue

      assets.push({
        url: publicUrl,
        query,
        photographer: photo.photographer,
        sourceUrl: photo.url,
        alt: `${input.brandName}: imagem de apoio para ${query}`,
      })
    } catch (error) {
      console.error('Error preparing Pexels visual asset:', error)
    }
  }

  return assets
}

export function buildVisualAssetsPrompt(assets: VisualAsset[]) {
  if (!assets.length) {
    return `
IMAGENS DE APOIO:
- Nenhuma imagem externa foi selecionada para este carrossel. Use apenas componentes, SVGs e formas CSS.
`
  }

  return `
IMAGENS DE APOIO CURADAS:
Use imagens apenas quando elas melhorarem o slide. Nao use imagem em todos os slides.
Imagens disponiveis:
${assets
  .map(
    (asset, index) =>
      `- asset_${index + 1}: ${asset.url} | alt="${asset.alt}" | busca="${asset.query}" | credito="${asset.photographer || 'Pexels'}"`
  )
  .join('\n')}

REGRAS PARA IMAGENS:
- Use no maximo 2 imagens no carrossel inteiro.
- Prefira slides 2, 3 ou 5. Evite imagem no slide 1 se o titulo for grande.
- A imagem deve ficar dentro de .photo-card, .photo-strip ou .photo-frame.
- Nunca coloque texto diretamente sobre foto sem overlay/card separado.
- Se usar imagem em um slide, reduza o texto desse slide.
`
}
