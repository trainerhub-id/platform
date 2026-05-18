import { and, asc, eq, inArray, isNull, notInArray } from 'drizzle-orm'
import { db } from '../db/client'
import {
  documents,
  dokumenPeserta,
  type NewTodo,
  peserta,
  pesertaBatch,
  pesertaCourseProgress,
  todos,
  users,
} from '../db/schema'

export class TodosRepository {
  async findPesertaByUserId(userId: string) {
    const [row] = await db.select().from(peserta).where(eq(peserta.clerkId, userId)).limit(1)
    return row ?? null
  }

  async ensurePesertaForUser(userId: string) {
    const existing = await this.findPesertaByUserId(userId)
    if (existing) return existing

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) return null

    const [profileByEmail] = await db
      .select()
      .from(peserta)
      .where(eq(peserta.email, user.email))
      .limit(1)
    if (profileByEmail) {
      const [updated] = await db
        .update(peserta)
        .set({ clerkId: user.id, updatedAt: new Date() })
        .where(eq(peserta.id, profileByEmail.id))
        .returning()
      return updated ?? profileByEmail
    }

    const [created] = await db
      .insert(peserta)
      .values({
        clerkId: user.id,
        nama: user.name || user.email,
        email: user.email,
        paymentStatus: 'pending',
      })
      .returning()
    return created ?? null
  }

  async findByUserId(userId: string) {
    return db.select().from(todos).where(eq(todos.userId, userId)).orderBy(asc(todos.createdAt))
  }

  async findAdmin(batchId?: string) {
    const conditions = [eq(todos.category, 'Admin' as never)]
    if (batchId) conditions.push(eq(todos.batchId, batchId))
    return db
      .select()
      .from(todos)
      .where(and(...conditions))
      .orderBy(asc(todos.createdAt))
  }

  async insertMany(values: NewTodo[]) {
    if (values.length === 0) return []
    return db.insert(todos).values(values).returning()
  }

  async insertMissing(values: NewTodo[]) {
    if (values.length === 0) return []
    const userId = values[0]?.userId
    if (!userId) return this.insertMany(values)
    const existing = await this.findByUserId(userId)
    const existingKeys = new Set(existing.map((row) => row.key))
    const missing = values.filter((value) => !existingKeys.has(value.key))
    if (missing.length === 0) return []
    return this.insertMany(missing)
  }

  async pruneUserTodosToKeys(userId: string, keys: string[]) {
    if (keys.length === 0) return
    await db.delete(todos).where(and(eq(todos.userId, userId), notInArray(todos.key, keys)))
  }

  async updateDefinitionMetadata(userId: string, values: NewTodo[]) {
    await Promise.all(
      values.map((value) =>
        db
          .update(todos)
          .set({
            title: value.title,
            category: value.category,
            isBlocking: value.isBlocking ?? false,
            updatedAt: new Date(),
          })
          .where(and(eq(todos.userId, userId), eq(todos.key, value.key))),
      ),
    )
  }

  async updateStatus(id: string, status: 'todo' | 'in_progress' | 'waiting_review' | 'done') {
    const [row] = await db
      .update(todos)
      .set({ status, completedAt: status === 'done' ? new Date() : null, updatedAt: new Date() })
      .where(eq(todos.id, id))
      .returning()
    return row ?? null
  }

  async markDone(userId: string, key: string) {
    const [row] = await db
      .update(todos)
      .set({ status: 'done', completedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(todos.userId, userId), eq(todos.key, key)))
      .returning()
    return row ?? null
  }

  async setStatusByKey(
    userId: string,
    key: string,
    status: 'todo' | 'in_progress' | 'waiting_review' | 'done',
  ) {
    const [row] = await db
      .update(todos)
      .set({ status, completedAt: status === 'done' ? new Date() : null, updatedAt: new Date() })
      .where(and(eq(todos.userId, userId), eq(todos.key, key)))
      .returning()
    return row ?? null
  }

  async hasPaidEnrollment(pesertaId: string) {
    const [row] = await db
      .select()
      .from(pesertaBatch)
      .where(and(eq(pesertaBatch.pesertaId, pesertaId), eq(pesertaBatch.paymentStatus, 'paid')))
      .limit(1)
    return !!row
  }

  async hasUploadedDocument(pesertaId: string) {
    const [row] = await db
      .select({ id: dokumenPeserta.id })
      .from(dokumenPeserta)
      .where(eq(dokumenPeserta.pesertaId, pesertaId))
      .limit(1)
    return !!row
  }

  async hasCompletedLesson(pesertaId: string) {
    const [row] = await db
      .select({ id: pesertaCourseProgress.id })
      .from(pesertaCourseProgress)
      .where(
        and(
          eq(pesertaCourseProgress.pesertaId, pesertaId),
          eq(pesertaCourseProgress.status, 'selesai'),
        ),
      )
      .limit(1)
    return !!row
  }

  async hasAiDocument(userId: string) {
    const [row] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(
        and(
          eq(documents.ownerUserId, userId),
          inArray(documents.flow, ['master', 'trainer']),
          isNull(documents.deletedAt),
        ),
      )
      .limit(1)
    return !!row
  }
}
