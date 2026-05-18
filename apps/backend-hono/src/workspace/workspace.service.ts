import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { batchTraining, courses, peserta, pesertaBatch, type Workspace } from '../db/schema'
import { generateWorkspaceSlug } from './slug-generator'
import { WorkspaceRepository } from './workspace.repository'

export type EnrollmentLookupResult = {
  enrollmentId: string
  userId: string
  pesertaId: string
  batchId: string
  batchNumber: number
  courseId: string
  courseShortCode: string
  courseTitle: string
}

type EnrollmentLookup = (enrollmentId: string) => Promise<EnrollmentLookupResult | null>

const defaultEnrollmentLookup: EnrollmentLookup = async (enrollmentId) => {
  const [row] = await db
    .select({
      enrollmentId: pesertaBatch.id,
      userId: peserta.clerkId,
      pesertaId: peserta.id,
      batchId: batchTraining.id,
      batchNumber: batchTraining.batchNumber,
      courseId: courses.id,
      courseShortCode: courses.shortCode,
      courseTitle: courses.title,
    })
    .from(pesertaBatch)
    .innerJoin(peserta, eq(pesertaBatch.pesertaId, peserta.id))
    .innerJoin(batchTraining, eq(pesertaBatch.batchId, batchTraining.id))
    .innerJoin(courses, eq(batchTraining.courseId, courses.id))
    .where(eq(pesertaBatch.id, enrollmentId))
    .limit(1)
  return row ?? null
}

type RepositoryLike = Pick<
  WorkspaceRepository,
  'listForUser' | 'findByUserAndSlug' | 'findByEnrollmentId' | 'create' | 'updateLastAccessed'
>

export class WorkspaceService {
  private readonly repository: RepositoryLike
  private readonly enrollmentLookup: EnrollmentLookup

  constructor(deps: { repository?: RepositoryLike; enrollmentLookup?: EnrollmentLookup } = {}) {
    this.repository = deps.repository ?? new WorkspaceRepository()
    this.enrollmentLookup = deps.enrollmentLookup ?? defaultEnrollmentLookup
  }

  listForUser(userId: string): Promise<Workspace[]> {
    return this.repository.listForUser(userId)
  }

  async findByUserAndSlug(userId: string, slug: string): Promise<Workspace | null> {
    const ws = await this.repository.findByUserAndSlug(userId, slug)
    if (ws) {
      // fire-and-forget update — log but don't throw
      this.repository.updateLastAccessed(ws.id, new Date()).catch(() => {})
    }
    return ws
  }

  async getDefaultForUser(userId: string): Promise<Workspace | null> {
    const list = await this.repository.listForUser(userId)
    if (list.length === 0) return null

    return list.reduce((best, current) => {
      const currentTs = (current.lastAccessedAt ?? current.createdAt).getTime()
      const bestTs = (best.lastAccessedAt ?? best.createdAt).getTime()
      return currentTs > bestTs ? current : best
    })
  }

  async createForEnrollment(enrollmentId: string): Promise<Workspace> {
    const existing = await this.repository.findByEnrollmentId(enrollmentId)
    if (existing) return existing

    const enrollment = await this.enrollmentLookup(enrollmentId)
    if (!enrollment) throw new Error('ENROLLMENT_NOT_FOUND')

    const slug = generateWorkspaceSlug({
      batchNumber: enrollment.batchNumber,
      courseShortCode: enrollment.courseShortCode,
    })
    const displayName = `${enrollment.courseTitle} - Batch ${enrollment.batchNumber}`

    return this.repository.create({
      slug,
      userId: enrollment.userId,
      pesertaId: enrollment.pesertaId,
      enrollmentId: enrollment.enrollmentId,
      batchId: enrollment.batchId,
      courseId: enrollment.courseId,
      displayName,
    })
  }
}
