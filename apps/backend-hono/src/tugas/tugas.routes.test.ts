import { describe, expect, test } from 'vitest'
import { Hono } from 'hono'
import { createTugasRoutes } from './tugas.routes'

describe('tugas routes', () => {
  test('returns task list for peserta', async () => {
    const app = new Hono<{ Variables: { user: { id: string; role: string } } }>()
    app.use('*', async (c, next) => {
      c.set('user', { id: 'user_1', role: 'peserta' })
      await next()
    })
    app.route(
      '/',
      createTugasRoutes({
        list: async () => [{ id: 'tugas_1', namaTugas: 'Upload KTP' }],
        upload: async () => ({}),
        review: async () => ({}),
        getPesertaTugas: async () => [],
        getPesertaTugasById: async () => [],
        getUploads: async () => [],
      } as never),
    )

    const res = await app.request('/tugas/list')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body[0].namaTugas).toBe('Upload KTP')
  })
})
