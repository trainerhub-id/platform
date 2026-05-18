import { describe, expect, it } from 'vitest'
import { createApp } from '../app'

function appWithRoutes(service: any) {
  return createApp({
    testUser: { id: 'user_1', email: 'u@example.com', name: 'U' },
    workspaceService: service,
  })
}

describe('GET /api/workspaces', () => {
  it('returns the user workspaces', async () => {
    const list = [
      {
        id: 'ws_1',
        slug: 'b1-trainers',
        displayName: 'Training for Trainers - Batch 1',
        status: 'active',
        lastAccessedAt: null,
        courseId: 'course_1',
        batchId: 'batch_1',
      },
    ]
    const app = appWithRoutes({
      listForUser: async (userId: string) => {
        expect(userId).toBe('user_1')
        return list
      },
    })

    const res = await app.request('/api/workspaces')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(list)
  })

  it('returns 401 when no user in session', async () => {
    const app = createApp({ workspaceService: { listForUser: async () => [] } as any }) // no testUser

    const res = await app.request('/api/workspaces')

    expect(res.status).toBe(401)
  })
})

describe('GET /api/workspaces/by-slug/:slug', () => {
  it('returns the workspace when user owns the slug', async () => {
    const ws = {
      id: 'ws_1',
      slug: 'b1-trainers',
      displayName: 'Training for Trainers - Batch 1',
      status: 'active',
      lastAccessedAt: null,
      courseId: 'course_1',
      batchId: 'batch_1',
    }
    const app = appWithRoutes({
      findByUserAndSlug: async (userId: string, slug: string) => {
        expect(userId).toBe('user_1')
        expect(slug).toBe('b1-trainers')
        return ws
      },
    })

    const res = await app.request('/api/workspaces/by-slug/b1-trainers')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(ws)
  })

  it('returns 404 when workspace not found', async () => {
    const app = appWithRoutes({
      findByUserAndSlug: async () => null,
    })

    const res = await app.request('/api/workspaces/by-slug/nope')

    expect(res.status).toBe(404)
  })
})
