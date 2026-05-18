import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { createCertificateRoutes } from './certificate.routes'

const cert = {
  id: 'cert_1',
  certificateNumber: 'TRH-2026-DIG-00001',
  courseName: 'Digital Marketing',
  completedAt: new Date('2026-05-01T00:00:00.000Z'),
  issuedAt: new Date('2026-05-02T00:00:00.000Z'),
  status: 'issued',
  pdfUrl: 'https://files.example/cert.pdf',
}

describe('certificate routes', () => {
  it('validates public certificate', async () => {
    const app = createCertificateRoutes({ validate: async () => ({ ...cert, valid: true }) } as any)

    const res = await app.request('/certificates/validate/TRH-2026-DIG-00001')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.valid).toBe(true)
  })

  it('blocks my certificate list without auth', async () => {
    const app = new Hono<{ Variables: { user: null } }>()
    app.use('*', async (c, next) => {
      c.set('user', null)
      await next()
    })
    app.route('/', createCertificateRoutes({ getMyCertificates: async () => [] } as any))

    const res = await app.request('/certificates/me')

    expect(res.status).toBe(401)
  })

  it('returns my certificates for authenticated peserta', async () => {
    const app = new Hono<{ Variables: { user: { id: string; role: string } } }>()
    app.use('*', async (c, next) => {
      c.set('user', { id: 'user_1', role: 'peserta' })
      await next()
    })
    app.route('/', createCertificateRoutes({ getMyCertificates: async () => [cert] } as any))

    const res = await app.request('/certificates/me')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.certificates[0].id).toBe('cert_1')
  })

  it('generates certificate for authenticated peserta', async () => {
    const app = new Hono<{ Variables: { user: { id: string; role: string } } }>()
    app.use('*', async (c, next) => {
      c.set('user', { id: 'user_1', role: 'peserta' })
      await next()
    })
    app.route('/', createCertificateRoutes({ generateCertificateForUser: async () => cert } as any))

    const res = await app.request('/certificates/generate/course_1', { method: 'POST' })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.certificate.id).toBe('cert_1')
  })
})
