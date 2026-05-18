export const AI_FEATURES = [
  {
    id: 'trainer',
    name: 'AI for Trainer',
    description:
      'Bantu buat lesson plan, design assessment, dan generate materi training dengan AI',
  },
  {
    id: 'master',
    name: 'AI for Master',
    description:
      'Analisis performa peserta, feedback otomatis, dan coaching tips untuk trainer master',
  },
  {
    id: 'branding',
    name: 'AI for Branding',
    description:
      'Personal branding ToT dan promosi training dengan gaya hangat & membimbing. Support LinkedIn, Instagram, Email, Website.',
  },
] as const

export type AiFeatureId = (typeof AI_FEATURES)[number]['id']
