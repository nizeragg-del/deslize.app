import { NextResponse } from 'next/server'

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function getClientIp(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || 'unknown'
  return req.headers.get('x-real-ip') || 'unknown'
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: now + windowMs }
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt }
  }

  current.count += 1
  return { allowed: true, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt }
}

export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))

  return NextResponse.json(
    { error: 'Muitas tentativas em pouco tempo. Tente novamente em alguns instantes.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
      },
    }
  )
}
