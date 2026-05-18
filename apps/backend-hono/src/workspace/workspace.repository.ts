import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { type Workspace, workspaces } from '../db/schema'

export type CreateWorkspaceInput = {
  slug: string
  userId: string
  pesertaId: string
  enrollmentId: string
  batchId: string
  courseId: string
  displayName: string
}

type WorkspaceDb = {
  findActiveByUserId(userId: string): Promise<Workspace[]>
  findOneByUserAndSlug(userId: string, slug: string): Promise<Workspace | null>
  findOneByEnrollmentId(enrollmentId: string): Promise<Workspace | null>
  insert(values: CreateWorkspaceInput): Promise<Workspace>
  updateLastAccessed(id: string, at: Date): Promise<void>
}

const defaultDb: WorkspaceDb = {
  async findActiveByUserId(userId) {
    return db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.userId, userId), eq(workspaces.status, 'active')))
      .orderBy(desc(workspaces.lastAccessedAt))
  },

  async findOneByUserAndSlug(userId, slug) {
    const [row] = await db
      .select()
      .from(workspaces)
      .where(
        and(
          eq(workspaces.userId, userId),
          eq(workspaces.slug, slug),
          eq(workspaces.status, 'active'),
        ),
      )
      .limit(1)
    return row ?? null
  },

  async findOneByEnrollmentId(enrollmentId) {
    const [row] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.enrollmentId, enrollmentId))
      .limit(1)
    return row ?? null
  },

  async insert(values) {
    const [row] = await db
      .insert(workspaces)
      .values({
        slug: values.slug,
        userId: values.userId,
        pesertaId: values.pesertaId,
        enrollmentId: values.enrollmentId,
        batchId: values.batchId,
        courseId: values.courseId,
        displayName: values.displayName,
        status: 'active',
      })
      .returning()
    if (!row) throw new Error('WORKSPACE_INSERT_FAILED')
    return row
  },

  async updateLastAccessed(id, at) {
    await db.update(workspaces).set({ lastAccessedAt: at, updatedAt: at }).where(eq(workspaces.id, id))
  },
}

export class WorkspaceRepository {
  private readonly impl: WorkspaceDb

  constructor(impl: WorkspaceDb = defaultDb) {
    this.impl = impl
  }

  listForUser(userId: string) {
    return this.impl.findActiveByUserId(userId)
  }

  findByUserAndSlug(userId: string, slug: string) {
    return this.impl.findOneByUserAndSlug(userId, slug)
  }

  findByEnrollmentId(enrollmentId: string) {
    return this.impl.findOneByEnrollmentId(enrollmentId)
  }

  create(input: CreateWorkspaceInput) {
    return this.impl.insert(input)
  }

  updateLastAccessed(id: string, at: Date = new Date()) {
    return this.impl.updateLastAccessed(id, at)
  }
}
