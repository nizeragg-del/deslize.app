'use client'

function inlineComputedStyles(source: Element, clone: Element) {
  if (source instanceof HTMLElement && clone instanceof HTMLElement) {
    const computed = window.getComputedStyle(source)
    const css: string[] = []

    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i]
      css.push(`${prop}:${computed.getPropertyValue(prop)};`)
    }

    clone.style.cssText = css.join('')
  }

  const sourceChildren = Array.from(source.children)
  const cloneChildren = Array.from(clone.children)

  sourceChildren.forEach((child, index) => {
    const clonedChild = cloneChildren[index]
    if (clonedChild) {
      inlineComputedStyles(child, clonedChild)
    }
  })
}

export function snapshotCarouselTrack(track: HTMLElement | null) {
  if (!track) return null

  const clone = track.cloneNode(true) as HTMLElement
  inlineComputedStyles(track, clone)

  clone.style.transform = 'none'
  clone.style.transition = 'none'
  clone.style.width = `${track.children.length * track.clientWidth}px`
  clone.style.height = `${track.clientHeight}px`

  Array.from(clone.querySelectorAll<HTMLElement>('.ig-slide')).forEach((slide) => {
    slide.style.width = `${track.clientWidth}px`
    slide.style.minWidth = `${track.clientWidth}px`
    slide.style.height = `${track.clientHeight}px`
    slide.style.flexShrink = '0'
  })

  return clone.innerHTML
}

const LEGACY_PUBLIC_SLIDES_BUCKET = 'slides'
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24

export async function getCarouselSlideUrls(supabase: any, carousel: any): Promise<string[]> {
  const slides = Array.isArray(carousel?.slides) ? carousel.slides : []

  const orderedSlides = slides
    .slice()
    .sort((a: any, b: any) => (a.slide_index ?? 0) - (b.slide_index ?? 0))

  const urls = await Promise.all(
    orderedSlides.map(async (slide: any) => {
      const path = slide?.storage_path
      const bucket = slide?.storage_bucket || LEGACY_PUBLIC_SLIDES_BUCKET

      if (!path) return ''

      if (bucket === LEGACY_PUBLIC_SLIDES_BUCKET) {
        return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

      if (error) {
        console.error('Error creating signed slide URL:', error)
        return ''
      }

      return data?.signedUrl || ''
    })
  )

  return urls.filter(Boolean)
}
