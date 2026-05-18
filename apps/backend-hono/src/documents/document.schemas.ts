import { z } from 'zod'

export const fieldStateSnapshotSchema = z.object({
  flow: z.enum(['master', 'trainer']),
  phaseKey: z.string().min(1),
  fieldKey: z.string().min(1),
  status: z.enum(['missing', 'captured', 'pending_confirmation', 'confirmed', 'rejected']),
  value: z.unknown().nullable().optional(),
})

export const readinessPreviewRequestSchema = z.object({
  flow: z.enum(['master']),
  fields: z.array(fieldStateSnapshotSchema),
})

export const documentFlowSchema = z.enum(['master', 'trainer'])

export const createDocumentSchema = z.object({
  flow: documentFlowSchema.default('master'),
  title: z.string().min(1).max(200),
})

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
})
