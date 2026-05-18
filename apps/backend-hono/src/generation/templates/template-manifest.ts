import { z } from 'zod'
import type { RendererName, RenderFlow, RenderOutputFormat } from '../renderers/renderer.types'

export type TemplateManifestEntry = {
  documentType: string
  flow: RenderFlow
  renderer: RendererName
  templatePath: string | null
  outputFormat: RenderOutputFormat
  requiredPayloadSchema: z.ZodTypeAny
  filename: (input: { documentType: string; title?: string }) => string
  version: string
}

const emptyPayloadSchema = z.record(z.string(), z.unknown())

function masterEntry(documentType: string): TemplateManifestEntry {
  return {
    documentType,
    flow: 'master',
    renderer: 'docx-template',
    templatePath: null,
    outputFormat: 'docx',
    requiredPayloadSchema: emptyPayloadSchema,
    filename: ({ documentType: type }) => `${type}.docx`,
    version: 'not-migrated',
  }
}

function programmaticMasterEntry(documentType: string): TemplateManifestEntry {
  return {
    documentType,
    flow: 'master',
    renderer: 'programmatic-docx',
    templatePath: null,
    outputFormat: 'docx',
    requiredPayloadSchema: emptyPayloadSchema,
    filename: ({ documentType: type }) => `${type}.docx`,
    version: 'hono-programmatic-v1',
  }
}

function trainerEntry(documentType: string): TemplateManifestEntry {
  return {
    documentType,
    flow: 'trainer',
    renderer: 'programmatic-docx',
    templatePath: null,
    outputFormat: 'docx',
    requiredPayloadSchema: emptyPayloadSchema,
    filename: ({ documentType: type }) => `${type}.docx`,
    version: 'hono-trainer-v1',
  }
}

export const TRAINER_DOCUMENT_TYPES = [
  'trainer-program-pelatihan',
  'trainer-lesson-plan',
  'trainer-job-safety-analysis',
  'trainer-pre-test',
  'trainer-post-test',
  'trainer-tna',
  'trainer-peta-kompetensi',
  'trainer-daftar-bahan',
  'trainer-daftar-peralatan',
  'trainer-evaluasi-pelatihan',
  'trainer-fr-ia-01',
  'trainer-fr-ia-02',
  'trainer-fr-ia-03',
  'trainer-penilaian-pre-test',
] as const

export type TrainerDocumentType = (typeof TRAINER_DOCUMENT_TYPES)[number]

export const TRAINER_DOCUMENT_CATEGORIES: Array<{
  id: string
  label: string
  types: TrainerDocumentType[]
}> = [
  {
    id: 'program',
    label: 'Program Dasar',
    types: ['trainer-program-pelatihan'],
  },
  {
    id: 'kurikulum',
    label: 'Kurikulum & Materi',
    types: ['trainer-lesson-plan', 'trainer-job-safety-analysis'],
  },
  {
    id: 'asesmen',
    label: 'Asesmen & Evaluasi',
    types: ['trainer-pre-test', 'trainer-post-test'],
  },
  {
    id: 'administrasi',
    label: 'Administrasi',
    types: [
      'trainer-tna',
      'trainer-peta-kompetensi',
      'trainer-daftar-bahan',
      'trainer-daftar-peralatan',
      'trainer-evaluasi-pelatihan',
      'trainer-fr-ia-01',
      'trainer-fr-ia-02',
      'trainer-fr-ia-03',
      'trainer-penilaian-pre-test',
    ],
  },
]

export const TRAINER_DOCUMENT_LABELS: Record<TrainerDocumentType, string> = {
  'trainer-program-pelatihan': 'Program Pelatihan',
  'trainer-lesson-plan': 'Lesson Plan',
  'trainer-job-safety-analysis': 'Job Safety Analysis',
  'trainer-pre-test': 'Pre-Test',
  'trainer-post-test': 'Post-Test',
  'trainer-tna': 'Training Needs Analysis',
  'trainer-peta-kompetensi': 'Peta Kompetensi',
  'trainer-daftar-bahan': 'Daftar Bahan',
  'trainer-daftar-peralatan': 'Daftar Peralatan',
  'trainer-evaluasi-pelatihan': 'Evaluasi Pelatihan',
  'trainer-fr-ia-01': 'FR.IA.01 Observasi',
  'trainer-fr-ia-02': 'FR.IA.02 Demonstrasi',
  'trainer-fr-ia-03': 'FR.IA.03 Lisan',
  'trainer-penilaian-pre-test': 'Penilaian Pre-Test',
}

export const templateManifest: TemplateManifestEntry[] = [
  programmaticMasterEntry('bukti-1'),
  programmaticMasterEntry('bukti-2'),
  programmaticMasterEntry('bukti-3'),
  programmaticMasterEntry('bukti-4'),
  programmaticMasterEntry('bukti-5'),
  programmaticMasterEntry('bukti-6'),
  programmaticMasterEntry('bukti-7'),
  programmaticMasterEntry('bukti-8'),
  ...TRAINER_DOCUMENT_TYPES.map(trainerEntry),
]

export function getTemplateManifestEntry(documentType: string): TemplateManifestEntry | null {
  return templateManifest.find((entry) => entry.documentType === documentType) ?? null
}
