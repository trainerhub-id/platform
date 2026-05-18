import { describe, expect, it, vi } from 'vitest'
import { TodosService } from './todos.service'

function makeRepository(overrides: any = {}) {
  return {
    findByWorkspace: vi.fn().mockResolvedValue([]),
    insertMissingForWorkspace: vi.fn().mockResolvedValue([]),
    pruneWorkspaceTodosToKeys: vi.fn().mockResolvedValue(undefined),
    updateDefinitionMetadataForWorkspace: vi.fn().mockResolvedValue(undefined),
    updateStatus: vi.fn().mockResolvedValue(null),
    setStatusByKey: vi.fn().mockResolvedValue(null),
    hasPaidEnrollment: vi.fn().mockResolvedValue(false),
    hasUploadedDocument: vi.fn().mockResolvedValue(false),
    hasCompletedLesson: vi.fn().mockResolvedValue(false),
    hasAiDocument: vi.fn().mockResolvedValue(false),
    ensurePesertaForUser: vi.fn().mockResolvedValue({ id: 'peserta_1', paymentStatus: 'pending' }),
    ...overrides,
  }
}

describe('TodosService', () => {
  it('listForWorkspace returns todos from repository', async () => {
    const rows = [{ id: 't1', workspaceId: 'ws_1', title: 'Upload KTP', status: 'todo' }]
    const repository = makeRepository({ findByWorkspace: vi.fn().mockResolvedValue(rows) })
    const service = new TodosService({ repository: repository as any })

    const result = await service.listForWorkspace('ws_1')

    expect(repository.findByWorkspace).toHaveBeenCalledWith('ws_1')
    expect(result.length).toBeGreaterThanOrEqual(1)
  })

  it('updateStatus passes workspace_id for ownership check', async () => {
    const updated = { id: 't1', workspaceId: 'ws_1', status: 'done' }
    const repository = makeRepository({ updateStatus: vi.fn().mockResolvedValue(updated) })
    const service = new TodosService({ repository: repository as any })

    const result = await service.updateStatus({ id: 't1', workspaceId: 'ws_1', status: 'done' })

    expect(repository.updateStatus).toHaveBeenCalledWith('t1', 'ws_1', 'done')
    expect(result).toEqual(updated)
  })

  it('updateStatus throws TODO_NOT_FOUND when repository returns null', async () => {
    const repository = makeRepository({ updateStatus: vi.fn().mockResolvedValue(null) })
    const service = new TodosService({ repository: repository as any })

    await expect(
      service.updateStatus({ id: 't_x', workspaceId: 'ws_1', status: 'done' }),
    ).rejects.toThrow(/TODO_NOT_FOUND/)
  })
})
