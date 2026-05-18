import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db/client'
import {
  chapters,
  courses,
  lessons,
  peserta,
  pesertaCourseProgress,
  sertifikat,
} from '../db/schema'

type CertificateLike = {
  id?: string
  certificateNumber: string | null
  courseName: string | null
  pesertaName?: string | null
  completedAt: Date | null
  createdAt: Date
  status: string
  fileUrl: string | null
}

type PublicUrlFn = (key: string) => Promise<string>

export function buildCertificateNumber(input: {
  year: number
  courseTitle: string
  sequence: number
}): string {
  const courseCode =
    input.courseTitle
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 3)
      .toUpperCase() || 'CRS'
  return `TRH-${input.year}-${courseCode}-${String(input.sequence).padStart(5, '0')}`
}

export async function mapValidationResult(cert: CertificateLike, getPublicUrl: PublicUrlFn) {
  return {
    valid: true,
    certificateNumber: cert.certificateNumber,
    pesertaName: cert.pesertaName,
    courseName: cert.courseName,
    completedAt: cert.completedAt,
    issuedAt: cert.createdAt,
    status: cert.status,
    pdfUrl: cert.fileUrl ? await getPublicUrl(cert.fileUrl) : null,
  }
}

export async function mapCertificateListItem(
  cert: CertificateLike & { id: string },
  getPublicUrl: PublicUrlFn,
) {
  return {
    id: cert.id,
    certificateNumber: cert.certificateNumber,
    courseName: cert.courseName,
    completedAt: cert.completedAt,
    issuedAt: cert.createdAt,
    status: cert.status,
    pdfUrl: cert.fileUrl ? await getPublicUrl(cert.fileUrl) : null,
  }
}

export class CertificateRepository {
  async findPesertaByUserId(userId: string) {
    const [row] = await db.select().from(peserta).where(eq(peserta.clerkId, userId)).limit(1)
    return row ?? null
  }

  async findCourseById(courseId: string) {
    const [row] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1)
    return row ?? null
  }

  async findByNumber(certificateNumber: string) {
    const [row] = await db
      .select()
      .from(sertifikat)
      .where(eq(sertifikat.certificateNumber, certificateNumber))
      .limit(1)
    return row ?? null
  }

  async findById(id: string) {
    const [row] = await db.select().from(sertifikat).where(eq(sertifikat.id, id)).limit(1)
    return row ?? null
  }

  async findPesertaById(id: string) {
    const [row] = await db.select().from(peserta).where(eq(peserta.id, id)).limit(1)
    return row ?? null
  }

  async findBnspByPeserta(pesertaId: string) {
    const [row] = await db
      .select()
      .from(sertifikat)
      .where(and(eq(sertifikat.pesertaId, pesertaId), eq(sertifikat.type, 'bnsp')))
      .limit(1)
    return row ?? null
  }

  async findByCourseAndPeserta(pesertaId: string, courseId: string) {
    const [row] = await db
      .select()
      .from(sertifikat)
      .where(
        and(
          eq(sertifikat.pesertaId, pesertaId),
          eq(sertifikat.courseId, courseId),
          eq(sertifikat.type, 'trainerhub'),
        ),
      )
      .limit(1)
    return row ?? null
  }

  async listByPeserta(pesertaId: string) {
    return db
      .select()
      .from(sertifikat)
      .where(and(eq(sertifikat.pesertaId, pesertaId), eq(sertifikat.type, 'trainerhub')))
      .orderBy(sql`${sertifikat.createdAt} DESC`)
  }

  async listAllByPeserta(pesertaId: string) {
    return db
      .select()
      .from(sertifikat)
      .where(eq(sertifikat.pesertaId, pesertaId))
      .orderBy(sql`${sertifikat.createdAt} DESC`)
  }

  async countCourseCertificatesForYear(courseId: string, year: number) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sertifikat)
      .where(
        and(
          eq(sertifikat.courseId, courseId),
          sql`EXTRACT(YEAR FROM ${sertifikat.createdAt}) = ${year}`,
        ),
      )
    return row?.count ?? 0
  }

  async createTrainerhubCertificate(input: {
    pesertaId: string
    courseId: string
    certificateNumber: string
    courseName: string
    pesertaName: string
    completedAt: Date
    fileUrl: string
  }) {
    const [row] = await db
      .insert(sertifikat)
      .values({
        pesertaId: input.pesertaId,
        courseId: input.courseId,
        type: 'trainerhub',
        status: 'issued',
        certificateNumber: input.certificateNumber,
        courseName: input.courseName,
        pesertaName: input.pesertaName,
        completedAt: input.completedAt,
        fileUrl: input.fileUrl,
        issuedDate: new Date(),
      })
      .returning()
    if (!row) throw new Error('CERTIFICATE_CREATE_FAILED')
    return row
  }

  async createBnspCertificate(input: {
    pesertaId: string
    nomorSertifikat?: string
    lsp?: string
    fileUrl: string
  }) {
    const [row] = await db
      .insert(sertifikat)
      .values({
        pesertaId: input.pesertaId,
        type: 'bnsp',
        status: 'issued',
        nomorSertifikat: input.nomorSertifikat,
        lsp: input.lsp,
        fileUrl: input.fileUrl,
        issuedDate: new Date(),
      })
      .returning()
    if (!row) throw new Error('BNSP_CERTIFICATE_CREATE_FAILED')
    return row
  }

  async updateBnspCertificate(
    id: string,
    input: { nomorSertifikat?: string | null; lsp?: string | null; fileUrl: string },
  ) {
    const [row] = await db
      .update(sertifikat)
      .set({
        nomorSertifikat: input.nomorSertifikat ?? undefined,
        lsp: input.lsp ?? undefined,
        fileUrl: input.fileUrl,
        status: 'issued',
        issuedDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sertifikat.id, id))
      .returning()
    if (!row) throw new Error('BNSP_CERTIFICATE_UPDATE_FAILED')
    return row
  }

  async getCourseProgress(pesertaId: string, courseId: string) {
    const courseChapters = await db.select().from(chapters).where(eq(chapters.courseId, courseId))
    const lessonIds: string[] = []
    for (const chapter of courseChapters) {
      const chapterLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.chapterId, chapter.id))
      lessonIds.push(...chapterLessons.map((lesson) => lesson.id))
    }
    if (lessonIds.length === 0) return { totalLessons: 0, completedLessons: 0, progress: 0 }
    const completed = await db
      .select()
      .from(pesertaCourseProgress)
      .where(
        and(
          eq(pesertaCourseProgress.pesertaId, pesertaId),
          eq(pesertaCourseProgress.status, 'selesai'),
          inArray(pesertaCourseProgress.lessonId, lessonIds),
        ),
      )
    return {
      totalLessons: lessonIds.length,
      completedLessons: completed.length,
      progress: (completed.length / lessonIds.length) * 100,
    }
  }

  async listCourses() {
    return db.select().from(courses)
  }
}
