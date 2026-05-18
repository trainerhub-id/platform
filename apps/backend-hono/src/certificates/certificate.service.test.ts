import { describe, expect, it } from 'vitest'
import { CertificateService } from './certificate.service'

const certificate = {
  id: 'cert_1',
  certificateNumber: 'TRH-2026-DIG-00001',
  courseName: 'Digital Marketing',
  pesertaName: 'Budi',
  completedAt: new Date('2026-05-01T00:00:00.000Z'),
  createdAt: new Date('2026-05-02T00:00:00.000Z'),
  status: 'issued',
  fileUrl: 'certificates/cert_1.pdf',
}

describe('CertificateService', () => {
  it('validates certificate by number', async () => {
    const service = new CertificateService({
      repository: { findByNumber: async () => certificate } as any,
      storage: { getPublicUrl: async (key: string) => `https://files.example/${key}` } as any,
    })

    const result = await service.validate('TRH-2026-DIG-00001')

    expect(result?.valid).toBe(true)
    expect(result?.pdfUrl).toBe('https://files.example/certificates/cert_1.pdf')
  })

  it('generates ReactPDF certificate for completed course', async () => {
    const created: unknown[] = []
    const service = new CertificateService({
      repository: {
        findPesertaByUserId: async () => ({ id: 'peserta_1', nama: 'Budi', clerkId: 'user_1' }),
        findCourseById: async () => ({ id: 'course_1', title: 'Digital Marketing' }),
        findByCourseAndPeserta: async () => null,
        getCourseProgress: async () => ({ progress: 100, totalLessons: 3, completedLessons: 3 }),
        countCourseCertificatesForYear: async () => 0,
        createTrainerhubCertificate: async (input: unknown) => {
          created.push(input)
          return { ...certificate, ...(input as object) }
        },
      } as any,
      storage: {
        uploadBuffer: async (_buffer: Buffer, path: string, mimeType: string) => ({
          key: `${path}/123.pdf`,
          url: `signed:${mimeType}`,
        }),
        getPublicUrl: async (key: string) => `https://files.example/${key}`,
        buildCertificatePath: (pesertaId: string, courseId: string) =>
          `storage/peserta/${pesertaId}/certificates/${courseId}`,
      } as any,
      pdf: { render: async () => Buffer.from('pdf') } as any,
      qr: { toDataURL: async () => 'data:image/png;base64,abc' } as any,
    })

    const result = await service.generateCertificateForUser('user_1', 'course_1')

    expect(created).toHaveLength(1)
    expect(result.certificateNumber).toBe('TRH-2026-DIG-00001')
    expect(result.pdfUrl).toBe(
      'https://files.example/storage/peserta/peserta_1/certificates/course_1/123.pdf',
    )
  })
})
