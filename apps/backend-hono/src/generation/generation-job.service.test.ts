import { describe, expect, it } from 'vitest'
import { buildGenerationRequestKey, GenerationJobService } from './generation-job.service'

describe('buildGenerationRequestKey', () => {
  it('uses provided request key when present', () => {
    expect(
      buildGenerationRequestKey({
        documentId: 'doc_1',
        jobType: 'generate-master-documents',
        documentTypes: ['bukti-1'],
        requestKey: 'client-key',
      }),
    ).toBe('client-key')
  })

  it('creates deterministic key with sorted document types', () => {
    expect(
      buildGenerationRequestKey({
        documentId: 'doc_1',
        jobType: 'generate-master-documents',
        documentTypes: ['bukti-2', 'bukti-1'],
      }),
    ).toBe('generate-master-documents:doc_1:bukti-1,bukti-2')
  })
})

describe('GenerationJobService', () => {
  it('returns existing job for same job type and request key without enqueue', async () => {
    let enqueued = 0
    const existing = { id: 'job_1', status: 'queued', requestKey: 'key_1' }
    const service = new GenerationJobService({
      jobs: {
        listByDocument: async () => [],
        findById: async () => existing,
        findByTypeAndRequestKey: async () => existing,
        create: async () => {
          throw new Error('should not create')
        },
        markBossJob: async () => existing,
        updateStatus: async () => existing,
      },
      enqueue: async () => {
        enqueued += 1
        return 'boss_1'
      },
    })

    const job = await service.enqueueGeneration({
      documentId: 'doc_1',
      jobType: 'generate-master-documents',
      documentTypes: ['bukti-1'],
      requestKey: 'key_1',
    })

    expect(job).toBe(existing)
    expect(enqueued).toBe(0)
  })

  it('requeues an existing job by id', async () => {
    let enqueued = 0
    const existing = {
      id: 'job_1',
      status: 'failed',
      requestKey: 'key_1',
      input: {
        documentId: 'doc_1',
        jobType: 'generate-master-documents',
        documentTypes: ['bukti-1'],
        requestKey: 'key_1',
      },
    }
    const queued = { ...existing, status: 'queued' }
    const service = new GenerationJobService({
      jobs: {
        listByDocument: async () => [],
        findById: async () => existing,
        findByTypeAndRequestKey: async () => existing,
        create: async () => existing,
        markBossJob: async () => existing,
        updateStatus: async () => queued,
      },
      enqueue: async () => {
        enqueued += 1
        return 'boss_1'
      },
    })

    const job = await service.retry('job_1')

    expect(job).toEqual(queued)
    expect(enqueued).toBe(1)
  })
})
