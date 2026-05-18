import * as QRCode from 'qrcode'
import { env } from '../config/env'
import { ObjectStorageService } from '../storage/object-storage.service'
import {
  buildCertificateNumber,
  CertificateRepository,
  mapCertificateListItem,
  mapValidationResult,
} from './certificate.repository'
import { type CertificatePdfData, CertificatePdfService } from './certificate-pdf.service'

type CertificateRecord = {
  id: string
  certificateNumber: string | null
  courseName: string | null
  pesertaName?: string | null
  completedAt: Date | null
  createdAt: Date
  status: string
  fileUrl: string | null
  nomorSertifikat?: string | null
  lsp?: string | null
}

type CertificateRepositoryLike = {
  findByNumber(certificateNumber: string): Promise<CertificateRecord | null>
  findById(id: string): Promise<CertificateRecord | null>
  findPesertaByUserId(userId: string): Promise<{ id: string; nama: string } | null>
  findPesertaById(id: string): Promise<{ id: string; nama: string } | null>
  findCourseById(courseId: string): Promise<{ id: string; title: string } | null>
  findByCourseAndPeserta(pesertaId: string, courseId: string): Promise<CertificateRecord | null>
  listByPeserta(pesertaId: string): Promise<CertificateRecord[]>
  listAllByPeserta?(pesertaId: string): Promise<CertificateRecord[]>
  listCourses(): Promise<{ id: string; title: string }[]>
  getCourseProgress(
    pesertaId: string,
    courseId: string,
  ): Promise<{ progress: number; totalLessons: number; completedLessons: number }>
  getBatchCourseProgress(pesertaId: string, courseIds: string[]): Promise<Map<string, number>>
  listCertificatesByCourseIds(
    pesertaId: string,
    courseIds: string[],
  ): Promise<{ id: string; courseId: string | null }[]>
  countCourseCertificatesForYear(courseId: string, year: number): Promise<number>
  createTrainerhubCertificate(input: {
    pesertaId: string
    courseId: string
    certificateNumber: string
    courseName: string
    pesertaName: string
    completedAt: Date
    fileUrl: string
  }): Promise<CertificateRecord>
  findBnspByPeserta(pesertaId: string): Promise<CertificateRecord | null>
  createBnspCertificate(input: {
    pesertaId: string
    nomorSertifikat?: string
    lsp?: string
    fileUrl: string
  }): Promise<CertificateRecord>
  updateBnspCertificate(
    id: string,
    input: { nomorSertifikat?: string | null; lsp?: string | null; fileUrl: string },
  ): Promise<CertificateRecord>
}

type StorageLike = {
  uploadBuffer(
    buffer: Buffer,
    path: string,
    contentType: string,
  ): Promise<{ key: string; url?: string }>
  upload(
    file: { originalname: string; buffer: Buffer | Uint8Array; mimetype: string; size: number },
    path: string,
  ): Promise<{ key: string; url?: string }>
  getPublicUrl(key: string): Promise<string>
  buildCertificatePath(pesertaId: string, courseId: string): string
  buildPesertaSertifikatPath(pesertaId: string): string
}

type QrLike = {
  toDataURL(text: string, options?: unknown): Promise<string>
}

export class CertificateService {
  private readonly repository: CertificateRepositoryLike
  private readonly storage: StorageLike
  private readonly pdf: Pick<CertificatePdfService, 'render'>
  private readonly qr: QrLike

  constructor(
    deps: {
      repository?: CertificateRepositoryLike
      storage?: StorageLike
      pdf?: Pick<CertificatePdfService, 'render'>
      qr?: QrLike
    } = {},
  ) {
    this.repository = deps.repository ?? new CertificateRepository()
    this.storage = deps.storage ?? new ObjectStorageService()
    this.pdf = deps.pdf ?? new CertificatePdfService()
    this.qr = deps.qr ?? QRCode
  }

  async uploadBnspCertificate(
    file: { originalname: string; buffer: Buffer | Uint8Array; mimetype: string; size: number },
    input: { pesertaId: string; nomorSertifikat?: string; lsp?: string },
  ) {
    const peserta = await this.repository.findPesertaById(input.pesertaId)
    if (!peserta) throw new Error('PESERTA_NOT_FOUND')
    const existing = await this.repository.findBnspByPeserta(input.pesertaId)
    const upload = await this.storage.upload(
      file,
      this.storage.buildPesertaSertifikatPath(input.pesertaId),
    )
    if (existing) {
      return this.repository.updateBnspCertificate(existing.id, {
        nomorSertifikat: input.nomorSertifikat ?? existing.nomorSertifikat ?? null,
        lsp: input.lsp ?? existing.lsp ?? null,
        fileUrl: upload.key,
      })
    }
    return this.repository.createBnspCertificate({
      pesertaId: input.pesertaId,
      ...(input.nomorSertifikat ? { nomorSertifikat: input.nomorSertifikat } : {}),
      ...(input.lsp ? { lsp: input.lsp } : {}),
      fileUrl: upload.key,
    })
  }

  async validate(certificateNumber: string) {
    const cert = await this.repository.findByNumber(certificateNumber)
    if (!cert) return null
    return mapValidationResult(cert, (key) => this.storage.getPublicUrl(key))
  }

  async getMyCertificates(userId: string) {
    const peserta = await this.repository.findPesertaByUserId(userId)
    if (!peserta) return []
    const certificates = await this.repository.listByPeserta(peserta.id)
    return Promise.all(
      certificates.map((cert) =>
        mapCertificateListItem({ ...cert, id: cert.id }, (key) => this.storage.getPublicUrl(key)),
      ),
    )
  }

  async getAllMyCertificates(userId: string) {
    const peserta = await this.repository.findPesertaByUserId(userId)
    if (!peserta || !this.repository.listAllByPeserta) return []
    const certificates = await this.repository.listAllByPeserta(peserta.id)
    return Promise.all(
      certificates.map(async (cert) => ({
        ...cert,
        fileUrl: cert.fileUrl ? await this.storage.getPublicUrl(cert.fileUrl) : null,
      })),
    )
  }

  async getEligibleCourses(userId: string) {
    const peserta = await this.repository.findPesertaByUserId(userId)
    if (!peserta) return []
    const courses = await this.repository.listCourses()
    if (courses.length === 0) return []
    const courseIds = courses.map((c) => c.id)
    const [progressMap, certificates] = await Promise.all([
      this.repository.getBatchCourseProgress(peserta.id, courseIds),
      this.repository.listCertificatesByCourseIds(peserta.id, courseIds),
    ])
    const certMap = new Map(certificates.map((c) => [c.courseId, c]))
    return courses.map((course) => {
      const cert = certMap.get(course.id) ?? null
      return {
        courseId: course.id,
        courseName: course.title,
        progress: progressMap.get(course.id) ?? 0,
        hasCertificate: !!cert,
        certificateId: cert?.id ?? null,
      }
    })
  }

  async findById(id: string) {
    return this.repository.findById(id)
  }

  async generateCertificateForUser(userId: string, courseId: string) {
    const peserta = await this.repository.findPesertaByUserId(userId)
    if (!peserta) throw new Error('PESERTA_NOT_FOUND')
    return this.generateForCourse(peserta.id, peserta.nama, courseId)
  }

  async generateForCourse(pesertaId: string, pesertaName: string, courseId: string) {
    const existing = await this.repository.findByCourseAndPeserta(pesertaId, courseId)
    if (existing)
      return mapCertificateListItem({ ...existing, id: existing.id }, (key) =>
        this.storage.getPublicUrl(key),
      )

    const course = await this.repository.findCourseById(courseId)
    if (!course) throw new Error('COURSE_NOT_FOUND')

    const progress = await this.repository.getCourseProgress(pesertaId, courseId)
    if (progress.progress < 100) throw new Error('COURSE_NOT_COMPLETE')

    const year = new Date().getFullYear()
    const count = await this.repository.countCourseCertificatesForYear(courseId, year)
    const certificateNumber = buildCertificateNumber({
      year,
      courseTitle: course.title,
      sequence: count + 1,
    })
    const validationUrl = `${env.FRONTEND_URL}/validate/${certificateNumber}`
    const qrCodeDataUri = await this.qr.toDataURL(validationUrl, { width: 300, margin: 1 })
    const completedAt = new Date()
    const issuedAt = new Date()
    const pdfData: CertificatePdfData = {
      pesertaName,
      courseName: course.title,
      certificateNumber,
      completedAt,
      issuedAt,
      trainerName: 'TrainerHub Team',
      qrCodeDataUri,
    }
    const pdf = await this.pdf.render(pdfData)
    const upload = await this.storage.uploadBuffer(
      pdf,
      this.storage.buildCertificatePath(pesertaId, courseId),
      'application/pdf',
    )
    const certificate = await this.repository.createTrainerhubCertificate({
      pesertaId,
      courseId,
      certificateNumber,
      courseName: course.title,
      pesertaName,
      completedAt,
      fileUrl: upload.key,
    })

    return mapCertificateListItem({ ...certificate, id: certificate.id }, (key) =>
      this.storage.getPublicUrl(key),
    )
  }
}
