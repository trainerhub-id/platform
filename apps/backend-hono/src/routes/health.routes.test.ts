import { describe, expect, it } from 'vitest'
import { createApp } from '../app'

describe('health routes', () => {
  it('returns health status', async () => {
    const app = createApp()
    const res = await app.request('/health')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ ok: true, service: 'trainerhub-backend-hono' })
    expect(res.headers.get('x-request-id')).toBeTruthy()
  })

  it('returns not found JSON', async () => {
    const app = createApp()
    const res = await app.request('/missing')
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error.code).toBe('NOT_FOUND')
  })
})
