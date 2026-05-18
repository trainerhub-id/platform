import { z } from 'zod'

export const extractedPatchSchema = z.object({
  flow: z.enum(['master', 'trainer']),
  phaseKey: z.string().min(1),
  fieldKey: z.string().min(1),
  value: z.unknown(),
  source: z.enum(['user_explicit', 'user_confirmed', 'imported', 'system']),
  confidence: z.number().min(0).max(1).optional(),
})

export const pendingSuggestionSchema = z.object({
  flow: z.enum(['master', 'trainer']),
  phaseKey: z.string().min(1),
  fieldKey: z.string().min(1),
  value: z.unknown(),
  reason: z.string().optional(),
})

export const confirmedPendingFieldSchema = z.object({
  flow: z.enum(['master', 'trainer']),
  phaseKey: z.string().min(1),
  fieldKey: z.string().min(1),
})

export const extractionResultSchema = z.object({
  patches: z.array(extractedPatchSchema).default([]),
  pendingSuggestions: z.array(pendingSuggestionSchema).default([]),
  confirmedPendingFields: z.array(confirmedPendingFieldSchema).default([]),
  generateConfirmed: z.boolean().default(false),
})

export type ExtractionResult = z.infer<typeof extractionResultSchema>
export type ExtractedPatch = z.infer<typeof extractedPatchSchema>
