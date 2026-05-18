import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { createTodosRoutes } from './todos.routes'

describe('todos routes', () => {
  test('returns current user todos', async () => {
    const app = new Hono<{ Variables: { user: { id: string; role: string } } }>()
    app.use('*', async (c, next) => {
      c.set('user', { id: 'user_1', role: 'peserta' })
      await next()
    })
    app.route(
      '/',
      createTodosRoutes({
        getTodosForUser: async (userId: string) => [
          { id: 'todo_1', userId, key: 'fill_data_awal' },
        ],
        initializeTodosForUser: async () => [],
        syncTodosWithProfileState: async () => undefined,
        getTodosForBatch: async () => [],
        initializeTodosForBatch: async () => [],
        updateTodoStatus: async () => null,
      } as never),
    )

    const res = await app.request('/todos/my')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body[0].userId).toBe('user_1')
  })
})
