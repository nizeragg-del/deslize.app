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

const SAFE_STYLE_PROPERTY = /^(background|background-color|background-image|border|border-color|border-radius|border-left|color|display|gap|height|left|margin|margin-bottom|margin-top|opacity|padding|position|right|top|width|z-index)\s*:/i

function sanitizeStyle(style: string) {
  return style
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part && SAFE_STYLE_PROPERTY.test(part) && !/url\s*\(|expression\s*\(|javascript:/i.test(part))
    .join('; ')
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

  return sanitized.replace(/\sstyle=(["'])(.*?)\1/gi, (_match, quote, value) => {
    const safeStyle = sanitizeStyle(value)
    return safeStyle ? ` style=${quote}${safeStyle}${quote}` : ''
  })
}
