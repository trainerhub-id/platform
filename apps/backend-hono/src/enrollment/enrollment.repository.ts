import { createHash } from 'node:crypto'
import { and, desc, eq, getTableColumns, ilike, or } from 'drizzle-orm'
import { db } from '../db/client'
import { batchTiers, batchTraining, peserta, pesertaBatch } from '../db/schema'

export type EnrollmentAccessRow = {
  enrollmentId: string
  paymentStatus: string
  tierName: string | null
  courseIds: string[] | null
  aiFeatures: string[] | null
  benefits: string[] | null
}

export type SetPaymentStatusInput = {
  enrollmentId: string
  paymentStatus: string
  enrollmentStatus?: string
}

export type EnsurePendingEnrollmentInput = {
  email: string
  whatsapp?: string | null
  batchId: string
  tierId: string
}

export class EnrollmentRepository {
  async findAccessByPesertaId(pesertaId: string): Promise<EnrollmentAccessRow[]> {
    return db
      .select({
        enrollmentId: pesertaBatch.id,
        paymentStatus: pesertaBatch.paymentStatus,
        tierName: batchTiers.name,
        courseIds: batchTiers.courseIds,
        aiFeatures: batchTiers.aiFeatures,
        benefits: batchTiers.benefits,
      })
      .from(pesertaBatch)
      .leftJoin(batchTiers, eq(pesertaBatch.tierId, batchTiers.id))
      .where(eq(pesertaBatch.pesertaId, pesertaId))
  }

  async listBatchEnrollments(batchId: string) {
    return db
      .select({
        ...getTableColumns(pesertaBatch),
        pesertaName: peserta.nama,
        pesertaEmail: peserta.email,
        pesertaPhone: peserta.noWa,
        tierName: batchTiers.name,
        tierSlug: batchTiers.slug,
      })
      .from(pesertaBatch)
      .leftJoin(peserta, eq(pesertaBatch.pesertaId, peserta.id))
      .leftJoin(batchTiers, eq(pesertaBatch.tierId, batchTiers.id))
      .where(eq(pesertaBatch.batchId, batchId))
      .orderBy(desc(pesertaBatch.createdAt))
  }

  async search(query: string) {
    const pattern = `%${query.trim()}%`
    return db
      .select({
        enrollmentId: pesertaBatch.id,
        pesertaId: peserta.id,
        pesertaName: peserta.nama,
        pesertaEmail: peserta.email,
        pesertaPhone: peserta.noWa,
        batchId: batchTraining.id,
        batchName: batchTraining.namaBatch,
        batchSlug: batchTraining.slug,
        tierId: batchTiers.id,
        tierName: batchTiers.name,
        paymentStatus: pesertaBatch.paymentStatus,
        enrollmentStatus: pesertaBatch.status,
      })
      .from(pesertaBatch)
      .leftJoin(peserta, eq(pesertaBatch.pesertaId, peserta.id))
      .leftJoin(batchTraining, eq(pesertaBatch.batchId, batchTraining.id))
      .leftJoin(batchTiers, eq(pesertaBatch.tierId, batchTiers.id))
      .where(
        or(
          ilike(peserta.nama, pattern),
          ilike(peserta.email, pattern),
          ilike(peserta.noWa, pattern),
          ilike(batchTraining.namaBatch, pattern),
        ),
      )
      .orderBy(desc(pesertaBatch.createdAt))
      .limit(20)
  }

  async setPaymentStatus(input: SetPaymentStatusInput) {
    const [row] = await db
      .update(pesertaBatch)
      .set({
        paymentStatus: input.paymentStatus,
        status:
          input.enrollmentStatus ?? (input.paymentStatus === 'paid' ? 'active' : 'registered'),
        updatedAt: new Date(),
      })
      .where(eq(pesertaBatch.id, input.enrollmentId))
      .returning()
    if (!row) throw new Error('ENROLLMENT_NOT_FOUND')
    return row
  }

  async ensurePendingEnrollmentForPayment(input: EnsurePendingEnrollmentInput) {
    const email = input.email.trim()
    const [existingPeserta] = await db
      .select()
      .from(peserta)
      .where(eq(peserta.email, email))
      .limit(1)
    const pesertaRow =
      existingPeserta ??
      (await this.createPendingPeserta({ email, whatsapp: input.whatsapp ?? null }))

    const [existingEnrollment] = await db
      .select()
      .from(pesertaBatch)
      .where(
        and(eq(pesertaBatch.pesertaId, pesertaRow.id), eq(pesertaBatch.batchId, input.batchId)),
      )
      .limit(1)

    if (existingEnrollment) {
      const [updated] = await db
        .update(pesertaBatch)
        .set({
          tierId: input.tierId,
          paymentStatus: 'pending',
          status: 'registered',
          updatedAt: new Date(),
        })
        .where(eq(pesertaBatch.id, existingEnrollment.id))
        .returning()
      if (!updated) throw new Error('ENROLLMENT_NOT_FOUND')
      return updated
    }

    const [created] = await db
      .insert(pesertaBatch)
      .values({
        pesertaId: pesertaRow.id,
        batchId: input.batchId,
        tierId: input.tierId,
        paymentStatus: 'pending',
        status: 'registered',
      })
      .returning()
    if (!created) throw new Error('ENROLLMENT_CREATE_FAILED')
    return created
  }

  private async createPendingPeserta(input: { email: string; whatsapp: string | null }) {
    const [created] = await db
      .insert(peserta)
      .values({
        clerkId: pendingClerkIdForEmail(input.email),
        nama: nameFromEmail(input.email),
        email: input.email,
        noWa: input.whatsapp,
        paymentStatus: 'pending',
      })
      .returning()
    if (!created) throw new Error('PESERTA_CREATE_FAILED')
    return created
  }
}

function nameFromEmail(email: string) {
  return email.split('@')[0]?.trim() || email
}

function pendingClerkIdForEmail(email: string) {
  const normalizedEmail = email.toLowerCase()
  const clerkId = `pending:${normalizedEmail}`
  if (clerkId.length <= 255) return clerkId
  return `pending:${createHash('sha256').update(normalizedEmail).digest('hex')}`
}
