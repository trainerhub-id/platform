import {
  AI_MASTER_CORE_FIELDS,
  aiMasterFieldLabels,
  type AiMasterApi,
  type AiMasterFieldKey,
  type AiMasterWorkspaceState,
  type ChatMessage,
  type SendMessageResult,
  type SlotState,
} from './contracts';
import { createInitialWorkspaceState, mockSkkniCandidates } from './mock-data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

type MockApiOptions = {
  latencyMs?: number;
};

function makeSlot(
  key: AiMasterFieldKey,
  value: string,
  status: SlotState['status'] = 'confirmed',
): SlotState {
  return {
    key,
    label: aiMasterFieldLabels[key],
    value,
    rawValue: value,
    status,
    source: status === 'draft' ? 'ai_inferred' : 'user',
    confidence: status === 'confirmed' ? 0.95 : 0.72,
    updatedAt: now(),
    evidence: value,
  };
}

function extractMockSlots(message: string): Partial<Record<AiMasterFieldKey, SlotState>> {
  const text = message.toLowerCase();
  const slots: Partial<Record<AiMasterFieldKey, SlotState>> = {};

  const organizationMatch = message.match(/(?:lembaganya|lembaga|pt)\s+([^,.;]+)/i);
  if (organizationMatch?.[1]) {
    const raw = organizationMatch[0].toLowerCase().startsWith('pt')
      ? organizationMatch[0]
      : organizationMatch[1];
    slots.organization_name = makeSlot(
      'organization_name',
      raw.trim().replace(/^pt\s+/i, 'PT '),
    );
  }

  if (/\bk3\b|hiradc|safety|hse/i.test(message)) {
    slots.organization_focus = makeSlot('organization_focus', 'K3');
  }

  const programMatch = message.match(/(?:programnya|program|pelatihan)\s+([^,.;]+)/i);
  if (programMatch?.[1]) {
    slots.program_name = makeSlot('program_name', programMatch[1].trim());
  }

  if (/hse officer|supervisor|operator|owner umkm|staf marketing/i.test(message)) {
    const target =
      message.match(/hse officer|supervisor|operator|owner umkm|staf marketing/i)?.[0] || 'Supervisor';
    slots.target_participants = makeSlot(
      'target_participants',
      target.replace(/\b\w/g, (c) => c.toUpperCase()),
    );
  }

  if (/masalah|problem|belum paham|kurang paham|risiko|bahaya/i.test(message)) {
    slots.industry_problem = makeSlot(
      'industry_problem',
      text.includes('identifikasi bahaya')
        ? 'Peserta belum memahami identifikasi bahaya dan pengendalian risiko'
        : 'Masalah industri perlu diperjelas berdasarkan konteks program',
      text.includes('identifikasi bahaya') ? 'confirmed' : 'draft',
    );
  }

  if (/\b\d+\s*(hari|jp|jam|minggu)\b/i.test(message)) {
    slots.training_duration = makeSlot(
      'training_duration',
      message.match(/\b\d+\s*(hari|jp|jam|minggu)\b/i)?.[0] || '',
      'draft',
    );
  }

  if (/online|offline|hybrid|daring|luring|tatap muka/i.test(message)) {
    const method = message.match(/online|offline|hybrid|daring|luring|tatap muka/i)?.[0] || 'Hybrid';
    slots.delivery_method = makeSlot('delivery_method', method, 'draft');
  }

  return slots;
}

function isMinimumComplete(state: AiMasterWorkspaceState): boolean {
  return AI_MASTER_CORE_FIELDS.every((field) => {
    const slot = state.slots[field];
    return !!slot?.value && ['confirmed', 'draft'].includes(slot.status);
  });
}

function recalculateDerivedState(state: AiMasterWorkspaceState): AiMasterWorkspaceState {
  const minimumComplete = isMinimumComplete(state);

  return {
    ...state,
    minimumComplete,
    generationReady: minimumComplete && !!state.selectedSkkniUnitId,
    phase: minimumComplete && state.phase === 'intake' ? 'draft_ready' : state.phase,
  };
}

function buildAssistantReply(state: AiMasterWorkspaceState, savedFields: AiMasterFieldKey[]): string {
  if (state.minimumComplete) {
    return 'Sip, 5 konteks inti sudah cukup untuk membuat draft awal. Saya bisa carikan unit kompetensi SKKNI yang paling relevan, lalu bagian lain seperti durasi dan evaluasi bisa saya isi sebagai draft yang nanti Anda review.';
  }

  const nextField = AI_MASTER_CORE_FIELDS.find((field) => !state.slots[field]?.value);
  if (!nextField) {
    return 'Konteks inti sudah hampir lengkap. Mau saya bantu rapikan jadi draft awal?';
  }

  const savedText =
    savedFields.length > 0
      ? `Saya sudah menangkap ${savedFields.map((field) => aiMasterFieldLabels[field]).join(', ')}. `
      : '';

  return `${savedText}Sekarang, ${aiMasterFieldLabels[nextField].toLowerCase()} ingin diisi seperti apa?`;
}

export function createMockAiMasterApi(options: MockApiOptions = {}): AiMasterApi {
  const latencyMs = options.latencyMs ?? 350;
  let state = createInitialWorkspaceState();

  const wait = () => delay(latencyMs);
  const cloneState = () => structuredClone(state) as AiMasterWorkspaceState;

  return {
    async loadWorkspace() {
      await wait();
      return cloneState();
    },

    async sendMessage(message: string): Promise<SendMessageResult> {
      await wait();
      const userMessage: ChatMessage = {
        id: id('msg-user'),
        role: 'user',
        content: message,
        createdAt: now(),
      };

      const extracted = extractMockSlots(message);
      const savedFields = Object.keys(extracted) as AiMasterFieldKey[];
      state = recalculateDerivedState({
        ...state,
        messages: [...state.messages, userMessage],
        slots: {
          ...state.slots,
          ...extracted,
        },
      });

      const assistantMessage: ChatMessage = {
        id: id('msg-assistant'),
        role: 'assistant',
        content: buildAssistantReply(state, savedFields),
        createdAt: now(),
        metadata: { savedFields },
      };
      state = { ...state, messages: [...state.messages, assistantMessage] };

      return { state: cloneState(), assistantMessage };
    },

    async acceptSlot(field: AiMasterFieldKey) {
      await wait();
      const slot = state.slots[field];
      if (slot) {
        state = recalculateDerivedState({
          ...state,
          slots: {
            ...state.slots,
            [field]: {
              ...slot,
              status: 'confirmed',
              confidence: Math.max(slot.confidence, 0.9),
              updatedAt: now(),
            },
          },
        });
      }
      return cloneState();
    },

    async updateSlot(field: AiMasterFieldKey, value: string) {
      await wait();
      state = recalculateDerivedState({
        ...state,
        slots: {
          ...state.slots,
          [field]: makeSlot(field, value, 'confirmed'),
        },
      });
      return cloneState();
    },

    async searchSkkni() {
      await wait();
      state = {
        ...state,
        phase: 'skkni_search',
        skkniCandidates: mockSkkniCandidates,
      };
      return cloneState();
    },

    async selectSkkniUnit(unitId: string) {
      await wait();
      state = {
        ...state,
        selectedSkkniUnitId: unitId,
        generationReady: state.minimumComplete,
        phase: 'draft_ready',
      };
      return cloneState();
    },

    async generateAllDocuments() {
      await wait();
      state = {
        ...state,
        phase: 'generating',
        documentProgress: state.documentProgress.map((document) => ({
          ...document,
          status: state.generationReady ? 'success' : 'needs_review',
          completionPercent: state.generationReady ? 100 : document.completionPercent,
          missingFields: state.generationReady ? [] : document.missingFields,
          downloadUrl: state.generationReady ? `https://example.test/${document.documentType}.docx` : undefined,
        })),
      };
      return cloneState();
    },
  };
}
