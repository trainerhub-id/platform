import { z } from 'zod'

export const ProgressStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'completed', 'failed']),
})

export const ProgressTrackerChoiceSchema = z.object({
  outcome: z.enum(['success', 'partial', 'failed', 'cancelled']),
  summary: z.string(),
  at: z.string(),
  identifiers: z.record(z.string(), z.string()).optional(),
})

export const SerializableProgressTrackerSchema = z.object({
  id: z.string(),
  steps: z.array(ProgressStepSchema),
  elapsedTime: z.number().optional(),
  choice: ProgressTrackerChoiceSchema.optional(),
})

export type ProgressStep = z.infer<typeof ProgressStepSchema>
export type ProgressTrackerChoice = z.infer<typeof ProgressTrackerChoiceSchema>
export type SerializableProgressTracker = z.infer<typeof SerializableProgressTrackerSchema>
