import { describe, expect, it, vi } from 'vitest'
import { Hono } from 'hono'
import { handleAppError } from '../common/errors'
import { createDokumenRoutes } from './dokumen.routes'

const fakeWorkspace = {
  id: 'ws_1',
  slug: 'b1-trainers',
  userId: 'user_1',
  pesertaId: 'peserta_1',
  enrollmentId: 'enroll_1',
  batchId: 'batch_1',
  courseId: 'course_1',
  displayName: 'Training for Trainers - Batch 1',
  status: 'active',
  lastAccessedAt: null,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const testUser = { id: 'user_1', email: 'u@e.com', name: 'U', role: 'peserta' }

function appWith(dokumenService: any, workspaceService: any = {
  findByUserAndSlug: async (userId: string, slug: string) =>
    slug === 'b1-trainers' && userId === 'user_1' ? fakeWorkspace : null,
}) {
  const app = new Hono()
  // Inject test user (simulates requireAuth)
  app.use('*', async (c, next) => {
    c.set('user', testUser as never)
    c.set('session', { id: 'test-session', userId: testUser.id } as never)
    await next()
  })
  app.route('/api', createDokumenRoutes({ dokumenService, workspaceService }))
  app.onError(handleAppError)
  return app
}

describe('GET /api/dokumen/kategori (workspace-scoped)', () => {
  it('returns 400 when X-Workspace-Slug missing', async () => {
    const app = appWith({ getKategoriForCourse: async () => [] })
    const res = await app.request('/api/dokumen/kategori')
    expect(res.status).toBe(400)
  })

  it('returns 404 when slug does not belong to user', async () => {
    const app = appWith({ getKategoriForCourse: async () => [] })
    const res = await app.request('/api/dokumen/kategori', {
      headers: { 'X-Workspace-Slug': 'b99-fake' },
    })
    expect(res.status).toBe(404)
  })

  it('returns kategori filtered by workspace courseId', async () => {
    const dokumenService = {
      getKategoriForCourse: vi.fn().mockResolvedValue([{ id: 'k', nama: 'Identitas' }]),
    }
    const app = appWith(dokumenService)
    const res = await app.request('/api/dokumen/kategori', {
      headers: { 'X-Workspace-Slug': 'b1-trainers' },
    })
    expect(res.status).toBe(200)
    expect(dokumenService.getKategoriForCourse).toHaveBeenCalledWith('course_1')
    expect(await res.json()).toEqual([{ id: 'k', nama: 'Identitas' }])
  })
})

describe('GET /api/dokumen/status', () => {
  it('returns workspace dokumen status', async () => {
    const dokumenService = {
      getStatus: vi.fn().mockResolvedValue([
        { id: 'd1', jenisId: 'j1', jenisNama: 'KTP', fileUrl: 'https://x', status: 'pending' },
      ]),
    }
    const app = appWith(dokumenService)
    const res = await app.request('/api/dokumen/status', {
      headers: { 'X-Workspace-Slug': 'b1-trainers' },
    })
    expect(res.status).toBe(200)
    expect(dokumenService.getStatus).toHaveBeenCalledWith('ws_1')
  })
})

describe('POST /api/dokumen/upload', () => {
  it('uploads a document', async () => {
    const upload = vi.fn().mockResolvedValue({ id: 'd_new' })
    const dokumenService = { upload }
    const app = appWith(dokumenService)

    const formData = new FormData()
    formData.set('file', new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' }))
    formData.set('jenisId', '00000000-0000-4000-8000-000000000001')

    const res = await app.request('/api/dokumen/upload', {
      method: 'POST',
      body: formData,
      headers: { 'X-Workspace-Slug': 'b1-trainers' },
    })

    expect(res.status).toBe(201)
    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({
        jenisId: '00000000-0000-4000-8000-000000000001',
        workspaceId: 'ws_1',
        pesertaId: 'peserta_1',
        courseId: 'course_1',
      }),
    )
  })

  it('returns 400 for INVALID_DOCUMENT_TYPE', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('INVALID_DOCUMENT_TYPE'))
    const dokumenService = { upload }
    const app = appWith(dokumenService)

    const formData = new FormData()
    formData.set('file', new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' }))
    formData.set('jenisId', '00000000-0000-4000-8000-000000000002')

    const res = await app.request('/api/dokumen/upload', {
      method: 'POST',
      body: formData,
      headers: { 'X-Workspace-Slug': 'b1-trainers' },
    })

    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/dokumen/:id', () => {
  it('deletes a workspace-scoped dokumen', async () => {
    const del = vi.fn().mockResolvedValue({ success: true })
    const dokumenService = { delete: del }
    const app = appWith(dokumenService)
    const res = await app.request('/api/dokumen/00000000-0000-4000-8000-000000000003', {
      method: 'DELETE',
      headers: { 'X-Workspace-Slug': 'b1-trainers' },
    })
    expect(res.status).toBe(200)
    expect(del).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000003', 'ws_1')
  })
})
