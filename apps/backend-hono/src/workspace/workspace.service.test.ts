import { describe, expect, it, vi } from 'vitest'
import { WorkspaceService } from './workspace.service'

function makeRow(overrides: any = {}) {
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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('WorkspaceService', () => {
  describe('listForUser', () => {
    it('returns workspaces from repository', async () => {
      const rows = [makeRow({ id: 'a' }), makeRow({ id: 'b', slug: 'b2-masters' })]
      const service = new WorkspaceService({
        repository: { listForUser: vi.fn().mockResolvedValue(rows) } as any,
      })

      expect(await service.listForUser('user_1')).toEqual(rows)
    })
  })

  describe('findByUserAndSlug', () => {
    it('returns workspace and updates last_accessed_at', async () => {
      const ws = makeRow()
      const updateLastAccessed = vi.fn().mockResolvedValue(undefined)
      const service = new WorkspaceService({
        repository: {
          findByUserAndSlug: vi.fn().mockResolvedValue(ws),
          updateLastAccessed,
        } as any,
      })

      const result = await service.findByUserAndSlug('user_1', 'b1-trainers')

      expect(result).toEqual(ws)
      expect(updateLastAccessed).toHaveBeenCalledWith('ws_1', expect.any(Date))
    })

    it('returns null and does not touch last_accessed when not found', async () => {
      const updateLastAccessed = vi.fn()
      const service = new WorkspaceService({
        repository: {
          findByUserAndSlug: vi.fn().mockResolvedValue(null),
          updateLastAccessed,
        } as any,
      })

      expect(await service.findByUserAndSlug('user_1', 'nope')).toBeNull()
      expect(updateLastAccessed).not.toHaveBeenCalled()
    })
  })

  describe('getDefaultForUser', () => {
    it('returns the workspace with most recent last_accessed_at', async () => {
      const a = makeRow({ id: 'a', lastAccessedAt: new Date('2026-01-05') })
      const b = makeRow({ id: 'b', lastAccessedAt: new Date('2026-01-10') })
      const service = new WorkspaceService({
        repository: { listForUser: vi.fn().mockResolvedValue([a, b]) } as any,
      })

      const result = await service.getDefaultForUser('user_1')

      expect(result?.id).toBe('b')
    })

    it('returns null when user has no workspaces', async () => {
      const service = new WorkspaceService({
        repository: { listForUser: vi.fn().mockResolvedValue([]) } as any,
      })

      expect(await service.getDefaultForUser('user_1')).toBeNull()
    })

    it('falls back to created_at when last_accessed_at is null', async () => {
      const a = makeRow({ id: 'a', lastAccessedAt: null, createdAt: new Date('2026-01-05') })
      const b = makeRow({ id: 'b', lastAccessedAt: null, createdAt: new Date('2026-01-10') })
      const service = new WorkspaceService({
        repository: { listForUser: vi.fn().mockResolvedValue([a, b]) } as any,
      })

      const result = await service.getDefaultForUser('user_1')

      expect(result?.id).toBe('b')
    })
  })

  describe('createForEnrollment', () => {
    it('throws if enrollment not found', async () => {
      const service = new WorkspaceService({
        repository: { findByEnrollmentId: vi.fn().mockResolvedValue(null) } as any,
        enrollmentLookup: vi.fn().mockResolvedValue(null),
      })

      await expect(service.createForEnrollment('enroll_missing')).rejects.toThrow(
        /ENROLLMENT_NOT_FOUND/,
      )
    })

    it('returns existing workspace if already created (idempotent)', async () => {
      const existing = makeRow()
      const repository = {
        findByEnrollmentId: vi.fn().mockResolvedValue(existing),
        create: vi.fn(),
      } as any
      const enrollmentLookup = vi.fn().mockResolvedValue({
        enrollmentId: 'enroll_1',
        userId: 'user_1',
        pesertaId: 'peserta_1',
        batchId: 'batch_1',
        batchNumber: 1,
        courseId: 'course_1',
        courseShortCode: 'trainers',
        courseTitle: 'Training for Trainers',
      })
      const service = new WorkspaceService({ repository, enrollmentLookup })

      const result = await service.createForEnrollment('enroll_1')

      expect(result).toEqual(existing)
      expect(repository.create).not.toHaveBeenCalled()
    })

    it('creates a new workspace with generated slug and display name', async () => {
      const created = makeRow({ id: 'ws_new', slug: 'b3-masters' })
      const repository = {
        findByEnrollmentId: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(created),
      } as any
      const enrollmentLookup = vi.fn().mockResolvedValue({
        enrollmentId: 'enroll_2',
        userId: 'user_1',
        pesertaId: 'peserta_1',
        batchId: 'batch_2',
        batchNumber: 3,
        courseId: 'course_2',
        courseShortCode: 'masters',
        courseTitle: 'Training for Masters',
      })
      const service = new WorkspaceService({ repository, enrollmentLookup })

      const result = await service.createForEnrollment('enroll_2')

      expect(result).toEqual(created)
      expect(repository.create).toHaveBeenCalledWith({
        slug: 'b3-masters',
        userId: 'user_1',
        pesertaId: 'peserta_1',
        enrollmentId: 'enroll_2',
        batchId: 'batch_2',
        courseId: 'course_2',
        displayName: 'Training for Masters - Batch 3',
      })
    })
  })
})
