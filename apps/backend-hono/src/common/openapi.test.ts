import { describe, expect, it } from 'vitest'
import { createApp } from '../app'

describe('openapi', () => {
  it('serves OpenAPI JSON', async () => {
    const app = createApp()
    const res = await app.request('/openapi.json')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.openapi).toBe('3.0.0')
    expect(body.info.title).toBe('TrainerHub Hono API')
  })
})
