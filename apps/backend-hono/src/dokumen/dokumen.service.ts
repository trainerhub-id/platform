import { and, asc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import {
  dokumenJenis,
  dokumenJenisProgram,
  dokumenKategori,
  dokumenPeserta,
} from '../db/schema'
import { ObjectStorageService } from '../storage/object-storage.service'

type StorageLike = {
  getPublicUrl(key: string): Promise<string>
  upload(
    file: { originalname: string; buffer: Buffer; mimetype: string; size: number },
    pathPrefix: string,
  ): Promise<{ key: string }>
  buildPesertaDocumentPath(pesertaId: string): string
}

export type DokumenStatusRow = {
  id: string
  jenisId: string
  jenisNama: string
  fileUrl: string
  status: 'pending' | 'revisi' | 'approved'
  catatanRevisi: string | null
  createdAt: Date
  updatedAt: Date
}

export type DokumenJenisForCourseRow = {
  id: string
  namaJenis: string
  orderIndex: number
  required: boolean
}

export type DokumenRepositoryLike = {
  findKategoriForCourse(courseId: string): Promise<Array<{ id: string; nama: string }>>
  findJenisByKategoriAndCourse(
    kategoriId: string,
    courseId: string,
  ): Promise<DokumenJenisForCourseRow[]>
  findStatusByWorkspace(workspaceId: string): Promise<DokumenStatusRow[]>
  isJenisInCourse(jenisId: string, courseId: string): Promise<boolean>
  upsertPesertaDokumen(input: {
    workspaceId: string
    pesertaId: string
    jenisId: string
    fileKey: string
  }): Promise<{ id: string }>
  deleteByIdAndWorkspace(id: string, workspaceId: string): Promise<{ count: number }>
}

const defaultRepository: DokumenRepositoryLike = {
  async findKategoriForCourse(courseId) {
    return db
      .selectDistinct({ id: dokumenKategori.id, nama: dokumenKategori.nama })
      .from(dokumenKategori)
      .innerJoin(dokumenJenis, eq(dokumenJenis.kategoriId, dokumenKategori.id))
      .innerJoin(
        dokumenJenisProgram,
        eq(dokumenJenisProgram.jenisId, dokumenJenis.id),
      )
      .where(eq(dokumenJenisProgram.courseId, courseId))
  },

  async findJenisByKategoriAndCourse(kategoriId, courseId) {
    return db
      .select({
        id: dokumenJenis.id,
        namaJenis: dokumenJenis.namaJenis,
        orderIndex: dokumenJenisProgram.orderIndex,
        required: dokumenJenisProgram.required,
      })
      .from(dokumenJenis)
      .innerJoin(
        dokumenJenisProgram,
        eq(dokumenJenisProgram.jenisId, dokumenJenis.id),
      )
      .where(
        and(
          eq(dokumenJenis.kategoriId, kategoriId),
          eq(dokumenJenisProgram.courseId, courseId),
        ),
      )
      .orderBy(asc(dokumenJenisProgram.orderIndex))
  },

  async findStatusByWorkspace(workspaceId) {
    return db
      .select({
        id: dokumenPeserta.id,
        jenisId: dokumenPeserta.jenisId,
        jenisNama: dokumenJenis.namaJenis,
        fileUrl: dokumenPeserta.fileUrl,
        status: dokumenPeserta.status,
        catatanRevisi: dokumenPeserta.catatanRevisi,
        createdAt: dokumenPeserta.createdAt,
        updatedAt: dokumenPeserta.updatedAt,
      })
      .from(dokumenPeserta)
      .leftJoin(dokumenJenis, eq(dokumenPeserta.jenisId, dokumenJenis.id))
      .where(eq(dokumenPeserta.workspaceId, workspaceId)) as Promise<DokumenStatusRow[]>
  },

  async isJenisInCourse(jenisId, courseId) {
    const [row] = await db
      .select({ jenisId: dokumenJenisProgram.jenisId })
      .from(dokumenJenisProgram)
      .where(
        and(
          eq(dokumenJenisProgram.jenisId, jenisId),
          eq(dokumenJenisProgram.courseId, courseId),
        ),
      )
      .limit(1)
    return !!row
  },

  async upsertPesertaDokumen(input) {
    const [existing] = await db
      .select()
      .from(dokumenPeserta)
      .where(
        and(
          eq(dokumenPeserta.workspaceId, input.workspaceId),
          eq(dokumenPeserta.jenisId, input.jenisId),
        ),
      )
      .limit(1)

    if (existing) {
      const [row] = await db
        .update(dokumenPeserta)
        .set({
          fileUrl: input.fileKey,
          status: 'pending',
          catatanRevisi: null,
          updatedAt: new Date(),
        })
        .where(eq(dokumenPeserta.id, existing.id))
        .returning()
      return { id: row.id }
    }

    const [row] = await db
      .insert(dokumenPeserta)
      .values({
        workspaceId: input.workspaceId,
        pesertaId: input.pesertaId,
        jenisId: input.jenisId,
        fileUrl: input.fileKey,
        status: 'pending',
      })
      .returning()
    return { id: row.id }
  },

  async deleteByIdAndWorkspace(id, workspaceId) {
    const result = await db
      .delete(dokumenPeserta)
      .where(and(eq(dokumenPeserta.id, id), eq(dokumenPeserta.workspaceId, workspaceId)))
      .returning({ id: dokumenPeserta.id })
    return { count: result.length }
  },
}

export type UploadInput = {
  file: File
  jenisId: string
  workspaceId: string
  pesertaId: string
  courseId: string
}

export class DokumenService {
  private readonly repository: DokumenRepositoryLike
  private readonly storage: StorageLike

  constructor(deps: { repository?: DokumenRepositoryLike; storage?: StorageLike } = {}) {
    this.repository = deps.repository ?? defaultRepository
    this.storage = deps.storage ?? new ObjectStorageService()
  }

  getKategoriForCourse(courseId: string) {
    return this.repository.findKategoriForCourse(courseId)
  }

  getJenisByKategoriAndCourse(kategoriId: string, courseId: string) {
    return this.repository.findJenisByKategoriAndCourse(kategoriId, courseId)
  }

  async getStatus(workspaceId: string) {
    const rows = await this.repository.findStatusByWorkspace(workspaceId)
    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        fileUrl: await this.storage.getPublicUrl(row.fileUrl),
      })),
    )
  }

  async upload(input: UploadInput) {
    const valid = await this.repository.isJenisInCourse(input.jenisId, input.courseId)
    if (!valid) throw new Error('INVALID_DOCUMENT_TYPE')

    const buffer = Buffer.from(await input.file.arrayBuffer())
    const uploaded = await this.storage.upload(
      {
        originalname: input.file.name || 'dokumen',
        buffer,
        mimetype: input.file.type || 'application/octet-stream',
        size: buffer.byteLength,
      },
      this.storage.buildPesertaDocumentPath(input.pesertaId),
    )

    return this.repository.upsertPesertaDokumen({
      workspaceId: input.workspaceId,
      pesertaId: input.pesertaId,
      jenisId: input.jenisId,
      fileKey: uploaded.key,
    })
  }

  async delete(id: string, workspaceId: string) {
    await this.repository.deleteByIdAndWorkspace(id, workspaceId)
    return { success: true }
  }
}
