import { describe, expect, it, vi } from 'vitest'
import { WorkspaceRepository } from './workspace.repository'
import type { Workspace } from '../db/schema'

function makeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
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
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

describe('WorkspaceRepository', () => {
  it('listForUser returns active workspaces ordered by last_accessed desc', async () => {
    const rows = [
      makeWorkspace({ id: 'a', slug: 'b1-trainers', lastAccessedAt: new Date('2026-01-10') }),
      makeWorkspace({ id: 'b', slug: 'b2-masters', lastAccessedAt: new Date('2026-01-05') }),
    ]
    const repo = new WorkspaceRepository({ findActiveByUserId: vi.fn().mockResolvedValue(rows) } as any)

    const result = await repo.listForUser('user_1')

    expect(result).toEqual(rows)
  })

  it('findByUserAndSlug returns matching active workspace', async () => {
    const ws = makeWorkspace({ slug: 'b1-trainers' })
    const repo = new WorkspaceRepository({
      findOneByUserAndSlug: vi.fn().mockResolvedValue(ws),
    } as any)

    const result = await repo.findByUserAndSlug('user_1', 'b1-trainers')

    expect(result).toEqual(ws)
  })

  it('findByEnrollmentId returns the linked workspace', async () => {
    const ws = makeWorkspace({ enrollmentId: 'enroll_1' })
    const repo = new WorkspaceRepository({
      findOneByEnrollmentId: vi.fn().mockResolvedValue(ws),
    } as any)

    const result = await repo.findByEnrollmentId('enroll_1')

    expect(result).toEqual(ws)
  })

  it('create returns the inserted workspace', async () => {
    const ws = makeWorkspace({ id: 'ws_new' })
    const repo = new WorkspaceRepository({
      insert: vi.fn().mockResolvedValue(ws),
    } as any)

    const result = await repo.create({
      slug: 'b1-trainers',
      userId: 'user_1',
      pesertaId: 'peserta_1',
      enrollmentId: 'enroll_1',
      batchId: 'batch_1',
      courseId: 'course_1',
      displayName: 'Training for Trainers - Batch 1',
    })

    expect(result).toEqual(ws)
  })
})
