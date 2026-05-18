import { describe, expect, it } from 'vitest'
import { AuditLogService } from './audit-log.service'

describe('AuditLogService', () => {
  it('records normalized admin actor and entity metadata', async () => {
    const events: unknown[] = []
    const service = new AuditLogService({
      repository: {
        create: async (input) => {
          events.push(input)
          return { id: 'audit_1', ...input, createdAt: new Date('2026-05-15T00:00:00.000Z') }
        },
        findMany: async () => [],
      },
    })

    await service.record({
      actor: { id: 'admin_1', email: 'admin@example.com', name: 'Admin Satu' },
      action: 'batch_tier.price_updated',
      entityType: 'batch_tier',
      entityId: 'tier_1',
      batchId: 'batch_1',
      before: { price: 2000000 },
      after: { price: 2500000 },
      metadata: { reason: 'promo closed' },
      requestId: 'req_1',
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    })

    expect(events).toEqual([
      {
        actorUserId: 'admin_1',
        actorEmail: 'admin@example.com',
        actorName: 'Admin Satu',
        action: 'batch_tier.price_updated',
        entityType: 'batch_tier',
        entityId: 'tier_1',
        batchId: 'batch_1',
        enrollmentId: null,
        pesertaId: null,
        before: { price: 2000000 },
        after: { price: 2500000 },
        metadata: { reason: 'promo closed' },
        requestId: 'req_1',
        ipAddress: '127.0.0.1',
        userAgent: 'vitest',
      },
    ])
  })
})
