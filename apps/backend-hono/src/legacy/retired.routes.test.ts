import { describe, expect, it } from 'vitest'
import { createRetiredRoutes } from './retired.routes'

describe('retired routes', () => {
  it('returns 410 for production-disabled template API routes', async () => {
    const app = createRetiredRoutes()

    const res = await app.request('/api/data/chat/ChatData')
    const body = await res.json()

    expect(res.status).toBe(410)
    expect(body.error.code).toBe('RETIRED_ROUTE')
  })
})
