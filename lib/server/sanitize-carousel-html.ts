import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  'div',
  'span',
  'p',
  'strong',
  'b',
  'em',
  'i',
  'small',
  'img',
  'svg',
  'path',
  'polyline',
  'line',
  'circle',
  'rect',
]

const ALLOWED_ATTR = [
  'alt',
  'aria-label',
  'class',
  'fill',
  'height',
  'stroke',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-width',
  'style',
  'viewBox',
  'width',
  'x1',
  'x2',
  'y1',
  'y2',
  'points',
  'd',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'src',
]

const SAFE_STYLE_PROPERTY = /^(background|background-color|background-image|border|border-color|border-radius|border-left|color|display|gap|height|left|margin|margin-bottom|margin-top|object-fit|object-position|opacity|padding|position|right|top|width|z-index)\s*:/i
const SAFE_IMAGE_HOSTS = [
  process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : '',
  'images.pexels.com',
].filter(Boolean)
const FORBIDDEN_CLASS_PATTERNS = [
  /^text-(base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|\[)/,
  /^(leading|tracking)-\[/,
  /^(my|mt|mb|py|pt|pb)-(5|6|7|8|9|10|11|12|14|16|20|24|28|32)$/,
  /^(h|min-h|max-h|w|min-w|max-w)-\[/,
  /^scale-/,
  /^-?translate-/,
]

function sanitizeStyle(style: string) {
  return style
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part && SAFE_STYLE_PROPERTY.test(part) && !/url\s*\(|expression\s*\(|javascript:/i.test(part))
    .join('; ')
}

function sanitizeClassNames(className: string) {
  return className
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part && !FORBIDDEN_CLASS_PATTERNS.some((pattern) => pattern.test(part)))
    .join(' ')
}

export function sanitizeCarouselSlidesHtml(html: string) {
  const sanitized = DOMPurify.sanitize(html, {
    FORCE_BODY: true,
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: true,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'style', 'link'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseenter', 'onmouseleave'],
  })

  return sanitized
    .replace(/\sstyle=(["'])(.*?)\1/gi, (_match, quote, value) => {
      const safeStyle = sanitizeStyle(value)
      return safeStyle ? ` style=${quote}${safeStyle}${quote}` : ''
    })
    .replace(/\sclass=(["'])(.*?)\1/gi, (_match, quote, value) => {
      const safeClassName = sanitizeClassNames(value)
      return safeClassName ? ` class=${quote}${safeClassName}${quote}` : ''
    })
    .replace(/\ssrc=(["'])(.*?)\1/gi, (_match, quote, value) => {
      try {
        const url = new URL(value)
        if (url.protocol !== 'https:' || !SAFE_IMAGE_HOSTS.includes(url.host)) return ''
        return ` src=${quote}${url.toString()}${quote}`
      } catch {
        return ''
      }
    })
}
