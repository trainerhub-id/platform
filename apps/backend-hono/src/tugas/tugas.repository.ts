import { and, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { peserta, tugas, tugasPeserta, tugasPesertaUpload } from '../db/schema'

export class TugasRepository {
  async list() {
    return db.select().from(tugas)
  }

  async findPesertaByUserId(userId: string) {
    const [row] = await db.select().from(peserta).where(eq(peserta.clerkId, userId)).limit(1)
    return row ?? null
  }

  async findTugasById(id: string) {
    const [row] = await db.select().from(tugas).where(eq(tugas.id, id)).limit(1)
    return row ?? null
  }

  async findSubmission(pesertaId: string, tugasId: string) {
    const [row] = await db
      .select()
      .from(tugasPeserta)
      .where(and(eq(tugasPeserta.pesertaId, pesertaId), eq(tugasPeserta.tugasId, tugasId)))
      .limit(1)
    return row ?? null
  }

  async createSubmission(pesertaId: string, tugasId: string) {
    const [row] = await db
      .insert(tugasPeserta)
      .values({ pesertaId, tugasId, status: 'submitted' })
      .returning()
    if (!row) throw new Error('TASK_SUBMISSION_NOT_FOUND')
    return row
  }

  async markSubmitted(id: string) {
    const [row] = await db
      .update(tugasPeserta)
      .set({ status: 'submitted', updatedAt: new Date() })
      .where(eq(tugasPeserta.id, id))
      .returning()
    return row ?? null
  }

  async createUpload(tugasPesertaId: string, fileUrl: string) {
    const [row] = await db
      .insert(tugasPesertaUpload)
      .values({ tugasPesertaId, fileUrl })
      .returning()
    if (!row) throw new Error('TASK_SUBMISSION_UPLOAD_NOT_FOUND')
    return row
  }

  async review(id: string, input: { nilai: string; catatanTrainer?: string | null }) {
    const [row] = await db
      .update(tugasPeserta)
      .set({
        nilai: input.nilai,
        catatanTrainer: input.catatanTrainer ?? null,
        status: 'reviewed',
        updatedAt: new Date(),
      })
      .where(eq(tugasPeserta.id, id))
      .returning()
    return row ?? null
  }

  async listSubmissionsByUserId(userId: string) {
    const profile = await this.findPesertaByUserId(userId)
    if (!profile) return []
    return this.listSubmissionsByPesertaId(profile.id)
  }

  async listSubmissionsByPesertaId(pesertaId: string) {
    return db.select().from(tugasPeserta).where(eq(tugasPeserta.pesertaId, pesertaId))
  }

  async listUploads(tugasPesertaId: string) {
    return db
      .select()
      .from(tugasPesertaUpload)
      .where(eq(tugasPesertaUpload.tugasPesertaId, tugasPesertaId))
  }
}
