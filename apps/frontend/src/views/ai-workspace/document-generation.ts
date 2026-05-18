export type DocGenStatus = 'idle' | 'generating' | 'ready'

export type DocItemStatus = 'done' | 'processing' | 'waiting'

export type DocItem = {
  id: string
  name: string
  status: DocItemStatus
}

export type DocCategory = {
  id: string
  name: string
  total: number
  done: number
  items: DocItem[]
}

export type DocumentGeneration = {
  status: DocGenStatus
  categories: DocCategory[]
}

export const TRAINER_DOC_CATEGORIES: DocCategory[] = [
  {
    id: 'program',
    name: 'Program Dasar',
    total: 1,
    done: 1,
    items: [{ id: 'program-pelatihan', name: 'Program Pelatihan', status: 'done' }],
  },
  {
    id: 'kurikulum',
    name: 'Kurikulum & Materi',
    total: 2,
    done: 2,
    items: [
      { id: 'lesson-plan', name: 'Lesson Plan', status: 'done' },
      { id: 'jsa', name: 'Job Safety Analysis', status: 'done' },
    ],
  },
  {
    id: 'asesmen',
    name: 'Asesmen & Evaluasi',
    total: 2,
    done: 2,
    items: [
      { id: 'pre-test', name: 'Pre-Test', status: 'done' },
      { id: 'post-test', name: 'Post-Test', status: 'done' },
    ],
  },
  {
    id: 'administrasi',
    name: 'Administrasi',
    total: 9,
    done: 9,
    items: [
      { id: 'tna', name: 'Training Needs Analysis', status: 'done' },
      { id: 'peta-kompetensi', name: 'Peta Kompetensi', status: 'done' },
      { id: 'daftar-bahan', name: 'Daftar Bahan', status: 'done' },
      { id: 'daftar-peralatan', name: 'Daftar Peralatan', status: 'done' },
      { id: 'evaluasi', name: 'Evaluasi Pelatihan', status: 'done' },
      { id: 'fr-ia-01', name: 'FR.IA.01 Observasi', status: 'done' },
      { id: 'fr-ia-02', name: 'FR.IA.02 Demonstrasi', status: 'done' },
      { id: 'fr-ia-03', name: 'FR.IA.03 Lisan', status: 'done' },
      { id: 'penilaian', name: 'Penilaian Pre-Test', status: 'done' },
    ],
  },
]

// For "Sedang Generate" state — partial progress
export const TRAINER_DOC_CATEGORIES_GENERATING: DocCategory[] = [
  {
    id: 'program',
    name: 'Program Dasar',
    total: 1,
    done: 1,
    items: [{ id: 'program-pelatihan', name: 'Program Pelatihan', status: 'done' }],
  },
  {
    id: 'kurikulum',
    name: 'Kurikulum & Materi',
    total: 2,
    done: 1,
    items: [
      { id: 'lesson-plan', name: 'Lesson Plan', status: 'done' },
      { id: 'jsa', name: 'Job Safety Analysis', status: 'processing' },
    ],
  },
  {
    id: 'asesmen',
    name: 'Asesmen & Evaluasi',
    total: 2,
    done: 0,
    items: [
      { id: 'pre-test', name: 'Pre-Test', status: 'waiting' },
      { id: 'post-test', name: 'Post-Test', status: 'waiting' },
    ],
  },
  {
    id: 'administrasi',
    name: 'Administrasi',
    total: 9,
    done: 7,
    items: [
      { id: 'tna', name: 'Training Needs Analysis', status: 'done' },
      { id: 'peta-kompetensi', name: 'Peta Kompetensi', status: 'done' },
      { id: 'daftar-bahan', name: 'Daftar Bahan', status: 'done' },
      { id: 'daftar-peralatan', name: 'Daftar Peralatan', status: 'done' },
      { id: 'evaluasi', name: 'Evaluasi Pelatihan', status: 'done' },
      { id: 'fr-ia-01', name: 'FR.IA.01 Observasi', status: 'done' },
      { id: 'fr-ia-02', name: 'FR.IA.02 Demonstrasi', status: 'done' },
      { id: 'fr-ia-03', name: 'FR.IA.03 Lisan', status: 'processing' },
      { id: 'penilaian', name: 'Penilaian Pre-Test', status: 'waiting' },
    ],
  },
]
