import { and, desc, eq } from 'drizzle-orm'
import type { PgBoss } from 'pg-boss'
import { db } from '../db/client'
import { generationJobs } from '../db/schema'

export type GenerationJobType =
  | 'generate-master-documents'
  | 'generate-trainer-documents'
  | 'regenerate-document'
  | 'render-single-document'

export type GenerationRequest = {
  documentId: string
  jobType: GenerationJobType
  documentTypes: string[]
  requestKey?: string
}

export function buildGenerationRequestKey(input: GenerationRequest): string {
  if (input.requestKey?.trim()) return input.requestKey.trim()
  return `${input.jobType}:${input.documentId}:${[...input.documentTypes].sort().join(',')}`
}

type GenerationJobRecord = { id: string; [key: string]: unknown }

type JobsRepository = {
  listByDocument(documentId: string): Promise<GenerationJobRecord[]>
  findById(id: string): Promise<GenerationJobRecord | null>
  findByTypeAndRequestKey(jobType: string, requestKey: string): Promise<GenerationJobRecord | null>
  create(input: {
    documentId: string
    jobType: string
    requestKey: string
    input: unknown
  }): Promise<GenerationJobRecord>
  markBossJob(id: string, bossJobId: string): Promise<GenerationJobRecord>
  updateStatus(id: string, status: string, error?: unknown): Promise<GenerationJobRecord | null>
}

class DbGenerationJobsRepository implements JobsRepository {
  async listByDocument(documentId: string) {
    return db
      .select()
      .from(generationJobs)
      .where(eq(generationJobs.documentId, documentId))
      .orderBy(desc(generationJobs.createdAt))
  }

  async findById(id: string) {
    const [job] = await db.select().from(generationJobs).where(eq(generationJobs.id, id)).limit(1)
    return job ?? null
  }

  async findByTypeAndRequestKey(jobType: string, requestKey: string) {
    const [job] = await db
      .select()
      .from(generationJobs)
      .where(and(eq(generationJobs.jobType, jobType), eq(generationJobs.requestKey, requestKey)))
      .limit(1)
    return job ?? null
  }

  async create(input: { documentId: string; jobType: string; requestKey: string; input: unknown }) {
    const [job] = await db
      .insert(generationJobs)
      .values({
        documentId: input.documentId,
        jobType: input.jobType,
        requestKey: input.requestKey,
        status: 'queued',
        input: input.input,
      })
      .returning()
    if (!job) throw new Error('GENERATION_JOB_CREATE_FAILED')
    return job
  }

  async markBossJob(id: string, bossJobId: string) {
    const [job] = await db
      .update(generationJobs)
      .set({ bossJobId, updatedAt: new Date() })
      .where(eq(generationJobs.id, id))
      .returning()
    if (!job) throw new Error('GENERATION_JOB_MARK_BOSS_FAILED')
    return job
  }

  async updateStatus(id: string, status: string, error?: unknown) {
    const [job] = await db
      .update(generationJobs)
      .set({ status, error: error ?? null, updatedAt: new Date() })
      .where(eq(generationJobs.id, id))
      .returning()
    return job ?? null
  }
}

type EnqueueFn = (
  jobName: string,
  payload: unknown,
  options: { singletonKey: string },
) => Promise<string | null>

export class GenerationJobService {
  private readonly jobs: JobsRepository
  private readonly enqueue: EnqueueFn

  constructor(deps: { jobs?: JobsRepository; enqueue?: EnqueueFn; boss?: PgBoss } = {}) {
    this.jobs = deps.jobs ?? new DbGenerationJobsRepository()
    this.enqueue =
      deps.enqueue ??
      (async (jobName, payload, options) => {
        if (!deps.boss) return null
        const id = await deps.boss.send(
          jobName,
          payload as object,
          { singletonKey: options.singletonKey } as never,
        )
        return id === null ? null : String(id)
      })
  }

  async listByDocument(documentId: string) {
    return this.jobs.listByDocument(documentId)
  }

  async findById(id: string) {
    return this.jobs.findById(id)
  }

  async retry(id: string) {
    const job = await this.jobs.findById(id)
    if (!job) return null
    const input = job.input as GenerationRequest
    const requestKey = buildGenerationRequestKey(input)
    const bossJobId = await this.enqueue(input.jobType, input, { singletonKey: requestKey })
    if (bossJobId) await this.jobs.markBossJob(id, bossJobId)
    return this.jobs.updateStatus(id, 'queued', null)
  }

  async enqueueGeneration(input: GenerationRequest) {
    const requestKey = buildGenerationRequestKey(input)
    const existing = await this.jobs.findByTypeAndRequestKey(input.jobType, requestKey)

    // If job exists but was never sent to boss (boss_job_id missing), re-enqueue
    if (existing) {
      if (!existing.bossJobId && existing.status === 'queued') {
        const bossJobId = await this.enqueue(input.jobType, input, { singletonKey: requestKey })
        if (bossJobId) return this.jobs.markBossJob(existing.id, bossJobId)
      }
      return existing
    }

    const job = await this.jobs.create({
      documentId: input.documentId,
      jobType: input.jobType,
      requestKey,
      input,
    })
    const bossJobId = await this.enqueue(input.jobType, input, { singletonKey: requestKey })
    if (!bossJobId) return job
    return this.jobs.markBossJob(job.id, bossJobId)
  }
}
