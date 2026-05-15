import {
  aiMasterFieldLabels,
  type AiMasterFieldKey,
  type AiMasterWorkspaceState,
  type DocumentProgress,
  type SkkniCandidate,
  type SlotState,
} from './contracts';

const now = () => new Date().toISOString();

export function emptySlot(key: AiMasterFieldKey): SlotState {
  return {
    key,
    label: aiMasterFieldLabels[key],
    value: null,
    status: 'empty',
    source: 'user',
    confidence: 0,
    updatedAt: now(),
  };
}

export const mockSkkniCandidates: SkkniCandidate[] = [
  {
    id: 'skkni-hiradc-1',
    unitCode: 'M.71KKK01.003.1',
    title: 'Melakukan Identifikasi Bahaya dan Pengendalian Risiko K3',
    relevanceScore: 0.94,
    reason: 'Sangat sesuai dengan program HIRADC untuk supervisor dan kebutuhan identifikasi bahaya.',
    evidence: ['Konteks program menyebut HIRADC', 'Target peserta adalah HSE Officer/Supervisor'],
  },
  {
    id: 'skkni-safety-2',
    unitCode: 'M.71KKK01.005.1',
    title: 'Menerapkan Prosedur Keselamatan dan Kesehatan Kerja',
    relevanceScore: 0.82,
    reason: 'Relevan untuk penguatan kepatuhan prosedur K3 di tempat kerja.',
    evidence: ['Bidang lembaga K3', 'Masalah industri terkait pemahaman risiko'],
  },
];

export const initialDocumentProgress: DocumentProgress[] = [
  {
    documentType: 'bukti-1',
    label: 'Bukti 1 - Program Pelatihan',
    status: 'locked',
    completionPercent: 35,
    missingFields: ['program_goal', 'training_duration', 'delivery_method'],
  },
  {
    documentType: 'bukti-4',
    label: 'Bukti 4 - Peta Kompetensi',
    status: 'locked',
    completionPercent: 20,
    missingFields: ['organization_focus', 'industry_problem'],
  },
  {
    documentType: 'bukti-7',
    label: 'Bukti 7 - Evaluasi Pelatihan',
    status: 'locked',
    completionPercent: 15,
    missingFields: ['evaluation_methods'],
  },
];

export function createInitialWorkspaceState(): AiMasterWorkspaceState {
  return {
    sessionId: 'mock-session-master-1',
    documentId: 'mock-document-master-1',
    phase: 'intake',
    messages: [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content:
          'Kita mulai dari 5 hal inti dulu ya: nama lembaga, bidang utama, nama program, target peserta, dan masalah industri yang ingin diselesaikan. Ceritakan bebas, tidak perlu seperti form.',
        createdAt: now(),
      },
    ],
    slots: {
      organization_name: emptySlot('organization_name'),
      organization_focus: emptySlot('organization_focus'),
      program_name: emptySlot('program_name'),
      target_participants: emptySlot('target_participants'),
      industry_problem: emptySlot('industry_problem'),
      training_duration: emptySlot('training_duration'),
      delivery_method: emptySlot('delivery_method'),
      evaluation_methods: emptySlot('evaluation_methods'),
    },
    minimumComplete: false,
    generationReady: false,
    selectedSkkniUnitId: null,
    skkniCandidates: [],
    documentProgress: initialDocumentProgress.map((document) => ({
      ...document,
      missingFields: [...document.missingFields],
    })),
  };
}
