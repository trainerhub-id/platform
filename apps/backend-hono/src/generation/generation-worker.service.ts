import { PgBoss } from 'pg-boss'
import { env } from '../config/env'
import { DocumentRepository } from '../documents/document.repository'
import { GenerationJobService } from './generation-job.service'
import { ObjectStorageService } from '../storage/object-storage.service'
import { DocumentGeneratorService } from './document-generator.service'
import { GeneratedFileRepository } from './generated-file.repository'
import type { GenerationJobType } from './generation-job.service'

export const generationWorkerJobNames = [
  'generate-master-documents',
  'generate-trainer-documents',
  'regenerate-document',
  'render-single-document',
] as const satisfies readonly GenerationJobType[]

type BossLike = {
  start(): Promise<unknown>
  stop(): Promise<void>
  work(
    name: string,
    handler: (jobs: Array<{ data: unknown }>) => Promise<unknown>,
  ): Promise<unknown>
}

type DocumentGeneratorLike = Pick<DocumentGeneratorService, 'generateFromJob'>

type ObjectStorageLike = Pick<ObjectStorageService, 'uploadBuffer'>

type GeneratedFilesLike = Pick<GeneratedFileRepository, 'create'>

export class GenerationWorkerService {
  private readonly boss: BossLike
  private readonly documentGenerator: DocumentGeneratorLike
  private readonly objectStorage: ObjectStorageLike
  private readonly generatedFiles: GeneratedFilesLike

  constructor(
    deps: {
      boss?: BossLike
      documentGenerator?: DocumentGeneratorLike
      objectStorage?: ObjectStorageLike
      generatedFiles?: GeneratedFilesLike
    } = {},
  ) {
    this.boss =
      deps.boss ?? new PgBoss({ connectionString: env.DATABASE_URL, schema: env.PGBOSS_SCHEMA })
    this.documentGenerator = deps.documentGenerator ?? new DocumentGeneratorService()
    this.objectStorage = deps.objectStorage ?? new ObjectStorageService()
    this.generatedFiles = deps.generatedFiles ?? new GeneratedFileRepository()
  }

  async start(): Promise<void> {
    await this.boss.start()
    for (const jobName of generationWorkerJobNames) {
      await this.boss.work(jobName, async (jobs) =>
        Promise.all(jobs.map((job) => this.processJob(job.data))),
      )
    }
  }

  private async processJob(data: unknown) {
    // data is GenerationRequest: { jobType, documentId, documentTypes, jobId? }
    const req = data as { documentId?: string; documentTypes?: string[]; jobId?: string }
    if (!req.documentId || !Array.isArray(req.documentTypes)) {
      throw new Error('INVALID_GENERATION_JOB_PAYLOAD')
    }

    const documents = new DocumentRepository()
    const doc = await documents.findById(req.documentId)
    if (!doc) throw new Error(`DOCUMENT_NOT_FOUND:${req.documentId}`)

    // Update job status to active
    const jobService = new GenerationJobService()
    const jobs = await jobService.listByDocument(req.documentId)
    const job = jobs.find((j) => (j as { bossJobId?: string }).bossJobId === req.jobId) ?? jobs[0]
    if (job) await jobService.updateStatus(job.id, 'active', null)

    const payload = {
      document: { id: doc.id, flow: doc.flow, masterJson: doc.masterJson, readiness: doc.readiness },
      documentTypes: req.documentTypes,
      jobId: job?.id,
    }

    const results = await this.documentGenerator.generateFromJob(payload)

    if (job) {
      for (const result of results) {
        const upload = await this.objectStorage.uploadBuffer(
          result.bytes,
          `generated/${doc.id}/${job.id}/${result.documentType}`,
          result.mimeType,
        )
        await this.generatedFiles.create({
          documentId: doc.id,
          generationJobId: job.id,
          documentType: result.documentType,
          outputFormat: result.outputFormat,
          filePath: upload.key,
          filename: result.filename,
          mimeType: result.mimeType,
          sizeBytes: result.bytes.byteLength,
        })
      }
      await jobService.updateStatus(job.id, 'completed', null)
    }

    return results
  }

  async stop(): Promise<void> {
    await this.boss.stop()
  }
}
