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

export const templateManifest: TemplateManifestEntry[] = [
  programmaticMasterEntry('bukti-1'),
  programmaticMasterEntry('bukti-2'),
  programmaticMasterEntry('bukti-3'),
  programmaticMasterEntry('bukti-4'),
  programmaticMasterEntry('bukti-5'),
  programmaticMasterEntry('bukti-6'),
  programmaticMasterEntry('bukti-7'),
  programmaticMasterEntry('bukti-8'),
]

export function getTemplateManifestEntry(documentType: string): TemplateManifestEntry | null {
  return templateManifest.find((entry) => entry.documentType === documentType) ?? null
}
