import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type Bucket = {
  count: number
  resetAt: number
}

type PersistentRateLimitRow = {
  allowed: boolean
  remaining: number
  reset_at: string
}

const buckets = new Map<string, Bucket>()

export function getClientIp(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || 'unknown'
  return req.headers.get('x-real-ip') || 'unknown'
}

function checkMemoryRateLimit(key: string, limit: number, windowMs: number) {
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

export async function checkRateLimit(key: string, limit: number, windowMs: number) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return checkMemoryRateLimit(key, limit, windowMs)
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const { data, error } = await supabaseAdmin
      .rpc('check_api_rate_limit', {
        p_key: key,
        p_limit: limit,
        p_window_seconds: Math.ceil(windowMs / 1000),
      })
      .single()

    const row = data as PersistentRateLimitRow | null

    if (error || !row) {
      console.error('Persistent rate limit failed, using memory fallback:', error)
      return checkMemoryRateLimit(key, limit, windowMs)
    }

    return {
      allowed: Boolean(row.allowed),
      remaining: Number(row.remaining || 0),
      resetAt: new Date(row.reset_at).getTime(),
    }
  } catch (error) {
    console.error('Unexpected persistent rate limit failure:', error)
    return checkMemoryRateLimit(key, limit, windowMs)
  }
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
