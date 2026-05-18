import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { createEnrollmentRoutes } from './enrollment.routes'

describe('enrollment routes', () => {
  it('searches enrollments for admins', async () => {
    const app = new Hono<{ Variables: { user: { id: string; email: string; role: string } } }>()
    app.use('*', async (c, next) => {
      c.set('user', { id: 'admin_1', email: 'admin@example.com', role: 'admin' })
      await next()
    })
    app.route(
      '/',
      createEnrollmentRoutes({
        search: async () => [
          {
            enrollmentId: 'enroll_1',
            pesertaName: 'Budi',
            batchName: 'Batch 22 Mei',
            paymentStatus: 'paid',
          },
        ],
        listBatchEnrollments: async () => [],
        markPaid: async () => ({ id: 'enroll_1' }),
      } as any),
    )

    const res = await app.request('/admin/enrollments/search?q=budi')
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      results: [
        {
          enrollmentId: 'enroll_1',
          pesertaName: 'Budi',
          batchName: 'Batch 22 Mei',
          paymentStatus: 'paid',
        },
      ],
    })
  })
})
