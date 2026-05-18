import type { MiddlewareHandler } from 'hono'
import { errorResponse } from './errors'

type RateLimitOptions = {
  windowMs: number
  max: number
}

export function rateLimit({ windowMs, max }: RateLimitOptions): MiddlewareHandler {
  const store = new Map<string, { count: number; resetAt: number }>()

  // Cleanup expired entries every window
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key)
    }
  }, windowMs)

  return async (c, next) => {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.req.header('x-real-ip') ??
      'unknown'

    const now = Date.now()
    const entry = store.get(ip)

    if (!entry || entry.resetAt <= now) {
      store.set(ip, { count: 1, resetAt: now + windowMs })
      await next()
      return
    }

    if (entry.count >= max) {
      c.header('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
      return errorResponse(c, 429, 'RATE_LIMITED', 'Too many requests, please try again later')
    }

    entry.count++
    await next()
  }
}
