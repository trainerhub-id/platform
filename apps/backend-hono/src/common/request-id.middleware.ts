import type { MiddlewareHandler } from 'hono'

export const requestIdMiddleware: MiddlewareHandler = async (c, next) => {
  const existing = c.req.header('x-request-id')
  const requestId = existing && existing.trim().length > 0 ? existing : crypto.randomUUID()
  c.set('requestId', requestId)
  await next()
  c.header('x-request-id', requestId)
}
