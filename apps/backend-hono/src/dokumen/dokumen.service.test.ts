import { describe, expect, it, vi } from 'vitest'
import { DokumenService } from './dokumen.service'

function makeStorage(overrides: any = {}) {
  return {
    getPublicUrl: async (key: string) => `https://cdn.example.com/${key}`,
    upload: vi.fn().mockResolvedValue({ key: 'uploads/file.pdf' }),
    buildPesertaDocumentPath: (pesertaId: string) => `peserta/${pesertaId}`,
    ...overrides,
  }
}

describe('DokumenService', () => {
  describe('getKategoriForCourse', () => {
    it('returns kategori filtered to those with jenis for this course', async () => {
      const repository = {
        findKategoriForCourse: vi.fn().mockResolvedValue([
          { id: 'kat_1', nama: 'Identitas' },
          { id: 'kat_2', nama: 'Pendidikan' },
        ]),
      }
      const service = new DokumenService({ repository: repository as any, storage: makeStorage() })

      const result = await service.getKategoriForCourse('course_1')

      expect(repository.findKategoriForCourse).toHaveBeenCalledWith('course_1')
      expect(result).toEqual([
        { id: 'kat_1', nama: 'Identitas' },
        { id: 'kat_2', nama: 'Pendidikan' },
      ])
    })
  })

  describe('getJenisByKategoriAndCourse', () => {
    it('returns jenis ordered by order_index with required flag', async () => {
      const rows = [
        { id: 'j_1', namaJenis: 'KTP', orderIndex: 1, required: true },
        { id: 'j_2', namaJenis: 'NPWP', orderIndex: 2, required: false },
      ]
      const repository = {
        findJenisByKategoriAndCourse: vi.fn().mockResolvedValue(rows),
      }
      const service = new DokumenService({ repository: repository as any, storage: makeStorage() })

      const result = await service.getJenisByKategoriAndCourse('kat_1', 'course_1')

      expect(repository.findJenisByKategoriAndCourse).toHaveBeenCalledWith('kat_1', 'course_1')
      expect(result).toEqual(rows)
    })
  })

  describe('getStatus', () => {
    it('returns dokumen_peserta rows for the workspace with public file urls', async () => {
      const repository = {
        findStatusByWorkspace: vi.fn().mockResolvedValue([
          {
            id: 'd_1',
            jenisId: 'j_1',
            jenisNama: 'KTP',
            fileUrl: 'uploads/ktp.pdf',
            status: 'pending',
            catatanRevisi: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      }
      const storage = makeStorage()
      const service = new DokumenService({ repository: repository as any, storage })

      const result = await service.getStatus('ws_1')

      expect(repository.findStatusByWorkspace).toHaveBeenCalledWith('ws_1')
      expect(result[0].fileUrl).toBe('https://cdn.example.com/uploads/ktp.pdf')
    })
  })

  describe('upload', () => {
    it('throws INVALID_DOCUMENT_TYPE when jenis does not belong to course', async () => {
      const repository = {
        isJenisInCourse: vi.fn().mockResolvedValue(false),
      }
      const service = new DokumenService({ repository: repository as any, storage: makeStorage() })

      const file = new File([new Uint8Array([1, 2, 3])], 'a.pdf', { type: 'application/pdf' })
      await expect(
        service.upload({
          file,
          jenisId: 'j_x',
          workspaceId: 'ws_1',
          pesertaId: 'peserta_1',
          courseId: 'course_1',
        }),
      ).rejects.toThrow(/INVALID_DOCUMENT_TYPE/)
    })

    it('uploads, then upserts the dokumen_peserta row scoped to workspace', async () => {
      const upsert = vi.fn().mockResolvedValue({ id: 'dp_1' })
      const repository = {
        isJenisInCourse: vi.fn().mockResolvedValue(true),
        upsertPesertaDokumen: upsert,
      }
      const storage = makeStorage()
      const service = new DokumenService({ repository: repository as any, storage })

      const file = new File([new Uint8Array([1, 2, 3])], 'a.pdf', { type: 'application/pdf' })

      const result = await service.upload({
        file,
        jenisId: 'j_1',
        workspaceId: 'ws_1',
        pesertaId: 'peserta_1',
        courseId: 'course_1',
      })

      expect(storage.upload).toHaveBeenCalled()
      expect(upsert).toHaveBeenCalledWith({
        workspaceId: 'ws_1',
        pesertaId: 'peserta_1',
        jenisId: 'j_1',
        fileKey: 'uploads/file.pdf',
      })
      expect(result.id).toBe('dp_1')
    })
  })

  describe('delete', () => {
    it('deletes a dokumen_peserta scoped to workspace', async () => {
      const repository = {
        deleteByIdAndWorkspace: vi.fn().mockResolvedValue({ count: 1 }),
      }
      const service = new DokumenService({ repository: repository as any, storage: makeStorage() })

      const result = await service.delete('dp_1', 'ws_1')

      expect(repository.deleteByIdAndWorkspace).toHaveBeenCalledWith('dp_1', 'ws_1')
      expect(result).toEqual({ success: true })
    })
  })
})
