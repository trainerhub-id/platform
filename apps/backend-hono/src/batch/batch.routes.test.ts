import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { handleAppError } from '../common/errors'
import { createBatchRoutes } from './batch.routes'

describe('batch routes', () => {
  it('lists batches for admin', async () => {
    const app = new Hono<{ Variables: { user: { id: string; role: string } } }>()
    app.use('*', async (c, next) => {
      c.set('user', { id: 'admin_1', role: 'admin' })
      await next()
    })
    app.route('/', createBatchRoutes({ listForUser: async () => [{ id: 'batch_1' }] } as any))

    const res = await app.request('/batch/list')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.batches[0].id).toBe('batch_1')
  })

  it('creates batch for admin', async () => {
    const app = new Hono<{ Variables: { user: { id: string; role: string } } }>()
    app.use('*', async (c, next) => {
      c.set('user', { id: 'admin_1', role: 'admin' })
      await next()
    })
    app.route('/', createBatchRoutes({ create: async () => ({ id: 'batch_1' }) } as any))

    const res = await app.request('/batch/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ namaBatch: 'Batch Q1', tanggal: '2026-05-01T00:00:00.000Z' }),
    })
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.batch.id).toBe('batch_1')
  })

  it('gets admin batch workspace', async () => {
    const app = new Hono<{ Variables: { user: { id: string; role: string } } }>()
    app.use('*', async (c, next) => {
      c.set('user', { id: 'admin_1', role: 'admin' })
      await next()
    })
    app.route(
      '/',
      createBatchRoutes({
        getWorkspace: async (batchId: string) => ({
          id: batchId,
          namaBatch: 'Batch Q1',
          totalEnrollments: 3,
          paidEnrollments: 1,
          pendingPayments: 2,
        }),
      } as any),
    )

    const res = await app.request('/admin/batches/batch_1/workspace')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.batch.id).toBe('batch_1')
    expect(body.batch.totalEnrollments).toBe(3)
  })

  it('publishes admin batch', async () => {
    const app = new Hono<{ Variables: { user: { id: string; role: string } } }>()
    app.use('*', async (c, next) => {
      c.set('user', { id: 'admin_1', role: 'admin' })
      await next()
    })
    app.route(
      '/',
      createBatchRoutes({
        publish: async (batchId: string) => ({ id: batchId, status: 'open' }),
      } as any),
    )

    const res = await app.request('/admin/batches/batch_1/publish', { method: 'POST' })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.batch).toEqual({ id: 'batch_1', status: 'open' })
  })

  it('returns validation error when publish is blocked', async () => {
    const app = new Hono<{ Variables: { user: { id: string; role: string }; requestId: string } }>()
    app.use('*', async (c, next) => {
      c.set('user', { id: 'admin_1', role: 'admin' })
      c.set('requestId', 'req_1')
      await next()
    })
    app.route(
      '/',
      createBatchRoutes({
        publish: async () => {
          throw new Error('BATCH_TIERS_NOT_SYNCED')
        },
      } as any),
    )
    app.onError(handleAppError)

    const res = await app.request('/admin/batches/batch_1/publish', { method: 'POST' })
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error.code).toBe('BATCH_TIERS_NOT_SYNCED')
  })
})
