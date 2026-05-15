import { z } from 'zod';

export const AI_MASTER_CORE_FIELDS = [
  'organization_name',
  'organization_focus',
  'program_name',
  'target_participants',
  'industry_problem',
] as const;

export const AI_MASTER_OPTIONAL_FIELDS = [
  'trainer_name',
  'organization_city',
  'program_goal',
  'training_location',
  'training_duration',
  'delivery_method',
  'evaluation_methods',
] as const;

export const AI_MASTER_ALL_FIELDS = [
  ...AI_MASTER_CORE_FIELDS,
  ...AI_MASTER_OPTIONAL_FIELDS,
] as const;

export type AiMasterFieldKey = (typeof AI_MASTER_ALL_FIELDS)[number];
export type AiMasterCoreFieldKey = (typeof AI_MASTER_CORE_FIELDS)[number];

export const slotStatusSchema = z.enum([
  'empty',
  'draft',
  'confirmed',
  'skipped',
  'needs_review',
]);

export const slotSourceSchema = z.enum([
  'user',
  'ai_inferred',
  'external_search',
  'system_default',
]);

export const aiMasterPhaseSchema = z.enum([
  'intake',
  'skkni_search',
  'draft_ready',
  'generating',
  'review',
]);

export const aiMasterFieldLabels: Record<AiMasterFieldKey, string> = {
  organization_name: 'Nama lembaga',
  organization_focus: 'Bidang utama lembaga',
  program_name: 'Nama program',
  target_participants: 'Target peserta',
  industry_problem: 'Masalah industri',
  trainer_name: 'Nama trainer',
  organization_city: 'Kota lembaga',
  program_goal: 'Tujuan program',
  training_location: 'Lokasi pelatihan',
  training_duration: 'Durasi pelatihan',
  delivery_method: 'Metode pelatihan',
  evaluation_methods: 'Metode evaluasi',
};

export const slotStateSchema = z.object({
  key: z.enum(AI_MASTER_ALL_FIELDS),
  label: z.string(),
  value: z.string().nullable(),
  rawValue: z.string().optional(),
  status: slotStatusSchema,
  source: slotSourceSchema,
  confidence: z.number().min(0).max(1),
  updatedAt: z.string(),
  evidence: z.string().optional(),
});

export type SlotState = z.infer<typeof slotStateSchema>;

export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['assistant', 'user', 'system']),
  content: z.string(),
  createdAt: z.string(),
  metadata: z
    .object({
      intent: z.string().optional(),
      savedFields: z.array(z.enum(AI_MASTER_ALL_FIELDS)).optional(),
    })
    .optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const skkniCandidateSchema = z.object({
  id: z.string(),
  unitCode: z.string(),
  title: z.string(),
  relevanceScore: z.number().min(0).max(1),
  reason: z.string(),
  evidence: z.array(z.string()),
});

export type SkkniCandidate = z.infer<typeof skkniCandidateSchema>;

export const documentProgressSchema = z.object({
  documentType: z.string(),
  label: z.string(),
  status: z.enum(['locked', 'ready', 'generating', 'success', 'failed', 'needs_review']),
  completionPercent: z.number().min(0).max(100),
  missingFields: z.array(z.enum(AI_MASTER_ALL_FIELDS)),
  downloadUrl: z.string().url().optional(),
});

export type DocumentProgress = z.infer<typeof documentProgressSchema>;

export const aiMasterWorkspaceStateSchema = z.object({
  sessionId: z.string(),
  documentId: z.string(),
  phase: aiMasterPhaseSchema,
  messages: z.array(chatMessageSchema),
  slots: z.partialRecord(z.enum(AI_MASTER_ALL_FIELDS), slotStateSchema),
  minimumComplete: z.boolean(),
  generationReady: z.boolean(),
  selectedSkkniUnitId: z.string().nullable(),
  skkniCandidates: z.array(skkniCandidateSchema),
  documentProgress: z.array(documentProgressSchema),
});

export type AiMasterWorkspaceState = z.infer<typeof aiMasterWorkspaceStateSchema>;

export type SendMessageResult = {
  state: AiMasterWorkspaceState;
  assistantMessage: ChatMessage;
};

export type AiMasterApi = {
  loadWorkspace(): Promise<AiMasterWorkspaceState>;
  sendMessage(message: string): Promise<SendMessageResult>;
  acceptSlot(field: AiMasterFieldKey): Promise<AiMasterWorkspaceState>;
  updateSlot(field: AiMasterFieldKey, value: string): Promise<AiMasterWorkspaceState>;
  searchSkkni(): Promise<AiMasterWorkspaceState>;
  selectSkkniUnit(unitId: string): Promise<AiMasterWorkspaceState>;
  generateAllDocuments(): Promise<AiMasterWorkspaceState>;
};
