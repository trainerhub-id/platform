import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { createPesertaRoutes } from './peserta.routes'

describe('peserta routes', () => {
  it('creates profile for authenticated peserta', async () => {
    const app = new Hono<{ Variables: { user: { id: string; email: string; role: string } } }>()
    app.use('*', async (c, next) => {
      c.set('user', { id: 'user_1', email: 'budi@example.com', role: 'peserta' })
      await next()
    })
    app.route(
      '/',
      createPesertaRoutes({
        create: async (userId: string, input: Record<string, unknown>) => ({
          id: 'peserta_1',
          clerkId: userId,
          ...input,
        }),
      } as any),
    )

    const res = await app.request('/peserta/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nama: 'Budi', email: 'budi@example.com' }),
    })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.profile.clerkId).toBe('user_1')
  })

  it('returns authenticated profile', async () => {
    const app = new Hono<{ Variables: { user: { id: string; email: string; role: string } } }>()
    app.use('*', async (c, next) => {
      c.set('user', { id: 'user_1', email: 'budi@example.com', role: 'peserta' })
      await next()
    })
    app.route(
      '/',
      createPesertaRoutes({ getProfile: async () => ({ id: 'peserta_1', nama: 'Budi' }) } as any),
    )

    const res = await app.request('/peserta/me')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.profile.nama).toBe('Budi')
  })
})
