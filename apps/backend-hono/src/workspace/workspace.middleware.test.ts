import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { errorResponse } from '../common/errors'
import { requireWorkspace, type WorkspaceContext } from './workspace.middleware'

function buildApp(service: any, user: any = { id: 'user_1' }) {
  const app = new Hono<{ Variables: WorkspaceContext & { user: any } }>()
  app.use('*', async (c, next) => {
    c.set('user', user)
    await next()
  })
  app.use('/dok/*', requireWorkspace(service))
  app.get('/dok/echo', (c) => {
    const ws = c.get('workspace')
    return c.json({ workspaceId: ws.id, slug: ws.slug })
  })
  app.onError((err, c) => errorResponse(c, 500, 'INTERNAL', err.message))
  return app
}

describe('requireWorkspace middleware', () => {
  it('returns 400 when X-Workspace-Slug header is missing', async () => {
    const app = buildApp({ findByUserAndSlug: async () => null })
    const res = await app.request('/dok/echo')
    expect(res.status).toBe(400)
  })

  it('returns 401 when user is not authenticated', async () => {
    const app = buildApp({ findByUserAndSlug: async () => null }, null)
    const res = await app.request('/dok/echo', {
      headers: { 'X-Workspace-Slug': 'b1-trainers' },
    })
    expect(res.status).toBe(401)
  })

  it('returns 404 when workspace is not found for user', async () => {
    const app = buildApp({ findByUserAndSlug: async () => null })
    const res = await app.request('/dok/echo', {
      headers: { 'X-Workspace-Slug': 'b99-nope' },
    })
    expect(res.status).toBe(404)
  })

  it('passes through and exposes workspace in context when valid', async () => {
    const ws = { id: 'ws_1', slug: 'b1-trainers', userId: 'user_1', courseId: 'c_1' }
    const app = buildApp({
      findByUserAndSlug: async (userId: string, slug: string) => {
        expect(userId).toBe('user_1')
        expect(slug).toBe('b1-trainers')
        return ws
      },
    })
    const res = await app.request('/dok/echo', {
      headers: { 'X-Workspace-Slug': 'b1-trainers' },
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ workspaceId: 'ws_1', slug: 'b1-trainers' })
  })
})
