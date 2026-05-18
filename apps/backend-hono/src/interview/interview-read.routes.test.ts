import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { createInterviewReadRoutes } from './interview.routes'

class FakeDocumentRepository {
  async findById() {
    return {
      id: 'doc_1',
      ownerUserId: 'user_1',
      flow: 'master',
      currentPhase: 'profile',
      readiness: { ready: false, missing: [] },
    }
  }
}

class FakeFieldStateRepository {
  async list() {
    return [
      {
        flow: 'master',
        phaseKey: 'profile',
        fieldKey: 'organization_name',
        status: 'confirmed',
        value: 'PT Maju Jaya',
      },
    ]
  }
}

class FakeConversationRepository {
  async recentMessages() {
    return [
      {
        id: 'm1',
        role: 'assistant',
        content: 'Halo',
        createdAt: '2026-05-15T00:00:00.000Z',
        metadata: {},
      },
    ]
  }
}

describe('interview read routes', () => {
  it('returns readiness checklist', async () => {
    const app = new Hono<{ Variables: { user: { id: string } } }>()
    app.use('*', async (c, next) => {
      c.set('user', { id: 'user_1' })
      await next()
    })
    app.route(
      '/',
      createInterviewReadRoutes({
        documents: new FakeDocumentRepository() as any,
        fieldStates: new FakeFieldStateRepository() as any,
        conversations: new FakeConversationRepository() as any,
      }),
    )

    const res = await app.request('/api/interview/doc_1/readiness')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.phase).toBe('profile')
    expect(body.fields[0].fieldKey).toBe('organization_name')
  })

  it('returns recent messages', async () => {
    const app = new Hono<{ Variables: { user: { id: string } } }>()
    app.use('*', async (c, next) => {
      c.set('user', { id: 'user_1' })
      await next()
    })
    app.route(
      '/',
      createInterviewReadRoutes({
        documents: new FakeDocumentRepository() as any,
        fieldStates: new FakeFieldStateRepository() as any,
        conversations: new FakeConversationRepository() as any,
      }),
    )

    const res = await app.request('/api/interview/doc_1/messages')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.messages[0].content).toBe('Halo')
  })

  it('returns conversation summary', async () => {
    const app = new Hono<{ Variables: { user: { id: string } } }>()
    app.use('*', async (c, next) => {
      c.set('user', { id: 'user_1' })
      await next()
    })
    app.route(
      '/',
      createInterviewReadRoutes({
        documents: new FakeDocumentRepository() as any,
        fieldStates: new FakeFieldStateRepository() as any,
        conversations: new FakeConversationRepository() as any,
      }),
    )

    const res = await app.request('/api/interview/doc_1/summary')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.summary).toContain('assistant: Halo')
  })
})
