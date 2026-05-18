import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { createAuditLogRoutes } from './audit-log.routes'

describe('audit log routes', () => {
  it('returns audit logs for admins', async () => {
    const batchId = '00000000-0000-4000-8000-000000000001'
    let receivedFilter: unknown
    const app = new Hono<{ Variables: { user: { id: string; email: string; role: string } } }>()
    app.use('*', async (c, next) => {
      c.set('user', { id: 'admin_1', email: 'admin@example.com', role: 'admin' })
      await next()
    })
    app.route(
      '/',
      createAuditLogRoutes({
        findMany: async (filter: unknown) => {
          receivedFilter = filter
          return [
            { id: 'audit_1', action: 'batch.published', entityType: 'batch', entityId: batchId },
          ]
        },
      } as any),
    )

    const res = await app.request(`/admin/audit-logs?batchId=${batchId}`)
    expect(res.status).toBe(200)
    expect(receivedFilter).toEqual({ batchId, limit: 100 })
    await expect(res.json()).resolves.toEqual({
      logs: [{ id: 'audit_1', action: 'batch.published', entityType: 'batch', entityId: batchId }],
    })
  })
})
