import { describe, expect, it } from 'bun:test'
import JSZip from 'jszip'
import { ProgrammaticDocxRenderer } from './programmatic-docx-renderer'

async function readDocumentXml(bytes: Uint8Array) {
  const zip = await JSZip.loadAsync(bytes)
  return zip.file('word/document.xml')?.async('string')
}

describe('ProgrammaticDocxRenderer', () => {
  it('renders distinct master bukti documents without placeholder content', async () => {
    const renderer = new ProgrammaticDocxRenderer()

    for (const documentType of [
      'bukti-1',
      'bukti-2',
      'bukti-3',
      'bukti-4',
      'bukti-5',
      'bukti-6',
      'bukti-7',
      'bukti-8',
    ]) {
      const rendered = await renderer.render({
        context: {
          flow: 'master',
          documentType,
          renderer: 'programmatic-docx',
          outputFormat: 'docx',
          templatePath: null,
        },
        payload: {
          program: {
            nama_pelatihan: 'Pelatihan Operator Forklift',
            tujuan_pelatihan: 'Mengoperasikan forklift dengan aman',
          },
          kompetensi: { kode_unit: 'LOG.001', nama_unit: 'Mengoperasikan Forklift' },
          sdm: { trainer: 'Budi Santoso', lembaga: 'LSP Logistik' },
        },
      })
      const xml = await readDocumentXml(rendered.bytes)

      expect(rendered.bytes.length).toBeGreaterThan(7_000)
      expect(xml).toContain(documentType.toUpperCase())
      expect(xml).toContain('Pelatihan Operator Forklift')
      expect(xml).not.toContain('placeholder')
    }
  })
})
