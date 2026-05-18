import { describe, expect, test } from 'vitest'
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
        service: {
          listForWorkspace: async (workspaceId: string) => [
            { id: 'todo_1', workspaceId, key: 'fill_data_awal' },
          ],
          initializeTodosForWorkspace: async () => [],
          syncTodosWithProfileState: async () => undefined,
          updateStatus: async () => null,
        } as never,
        workspaceService: {
          findByUserAndSlug: async (userId: string, slug: string) =>
            ({
              id: 'workspace_1',
              userId,
              slug,
              pesertaId: 'peserta_1',
            }) as never,
        },
      }),
    )

    const res = await app.request('/todos/my', { headers: { 'X-Workspace-Slug': 'default' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body[0].workspaceId).toBe('workspace_1')
  })
})
