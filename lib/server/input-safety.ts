const CSS_COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\))$/i
const FONT_RE = /^[a-z0-9 ]{1,48}$/i

export function safeCssColor(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return CSS_COLOR_RE.test(trimmed) ? trimmed : fallback
}

export function safeFontFamily(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return FONT_RE.test(trimmed) ? trimmed : fallback
}

export function isPrivateOrLocalHostname(hostname: string) {
  const lower = hostname.toLowerCase()
  if (lower === 'localhost' || lower.endsWith('.localhost')) return true

  const parts = lower.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false

  const [a, b] = parts
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  )
}

export function safeHttpsUrl(value: unknown) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 2048) return ''

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:' || isPrivateOrLocalHostname(parsed.hostname)) return ''
    return parsed.toString()
  } catch {
    return ''
  }
}
