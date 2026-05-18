import type { AiFlow, FieldStatus, InterviewReadiness, ReadinessField } from './ai-workspace.api'

export type CheckpointField = {
  phaseKey: string
  fieldKey: string
  label: string
  optional?: boolean
}

export type CheckpointGroup = {
  phaseKey: string
  label: string
  description: string
  fields: CheckpointField[]
}

export const checkpointConfig: Record<AiFlow, CheckpointGroup[]> = {
  master: [
    {
      phaseKey: 'profile',
      label: 'Profil Master',
      description: 'Identitas lembaga, program, peserta, dan konteks pelatihan.',
      fields: [
        { phaseKey: 'profile', fieldKey: 'trainer_name', label: 'Nama trainer' },
        { phaseKey: 'profile', fieldKey: 'organization_name', label: 'Nama lembaga' },
        { phaseKey: 'profile', fieldKey: 'organization_focus', label: 'Bidang pelatihan' },
        { phaseKey: 'profile', fieldKey: 'target_participants', label: 'Target peserta' },
        { phaseKey: 'profile', fieldKey: 'industry_problem', label: 'Masalah utama' },
        { phaseKey: 'profile', fieldKey: 'program_goal', label: 'Hasil utama' },
        { phaseKey: 'profile', fieldKey: 'training_location', label: 'Lokasi pelatihan' },
        { phaseKey: 'profile', fieldKey: 'training_duration', label: 'Durasi pelatihan' },
        { phaseKey: 'profile', fieldKey: 'program_name', label: 'Nama program', optional: true },
        {
          phaseKey: 'profile',
          fieldKey: 'organization_city',
          label: 'Kota lembaga',
          optional: true,
        },
      ],
    },
    {
      phaseKey: 'unit_selection',
      label: 'Unit SKKNI',
      description: 'Unit kompetensi yang akan menjadi dasar dokumen.',
      fields: [
        { phaseKey: 'unit_selection', fieldKey: 'selected_unit_code', label: 'Kode unit' },
        { phaseKey: 'unit_selection', fieldKey: 'unit_detail', label: 'Detail unit' },
      ],
    },
    {
      phaseKey: 'competency_map',
      label: 'Peta Kompetensi',
      description: 'Elemen, KUK, dan struktur asesmen dari unit terpilih.',
      fields: [{ phaseKey: 'competency_map', fieldKey: 'skkni_map', label: 'Peta SKKNI' }],
    },
  ],
  trainer: [
    {
      phaseKey: 'brainstorming',
      label: 'Brainstorming',
      description: 'Arah kelas, audiens, hasil belajar, dan institusi.',
      fields: [
        { phaseKey: 'brainstorming', fieldKey: 'trainer_name', label: 'Nama trainer' },
        { phaseKey: 'brainstorming', fieldKey: 'institution', label: 'Lembaga / Mandiri' },
        { phaseKey: 'brainstorming', fieldKey: 'expertise', label: 'Bidang keahlian' },
        { phaseKey: 'brainstorming', fieldKey: 'audience', label: 'Target peserta' },
        { phaseKey: 'brainstorming', fieldKey: 'outcome', label: 'Hasil pelatihan' },
        {
          phaseKey: 'brainstorming',
          fieldKey: 'activities',
          label: 'Aktivitas belajar',
          optional: true,
        },
        {
          phaseKey: 'brainstorming',
          fieldKey: 'training_objective',
          label: 'Tujuan pelatihan',
          optional: true,
        },
        {
          phaseKey: 'brainstorming',
          fieldKey: 'training_date',
          label: 'Tanggal pelatihan',
          optional: true,
        },
      ],
    },
    {
      phaseKey: 'unit_selection',
      label: 'Unit SKKNI',
      description: 'Unit kompetensi yang cocok dengan rancangan kelas.',
      fields: [
        { phaseKey: 'unit_selection', fieldKey: 'selected_unit_code', label: 'Kode unit' },
        { phaseKey: 'unit_selection', fieldKey: 'unit_detail', label: 'Detail unit' },
      ],
    },
    {
      phaseKey: 'competency_map',
      label: 'Peta Kompetensi',
      description: 'Peta elemen dan KUK untuk materi trainer.',
      fields: [{ phaseKey: 'competency_map', fieldKey: 'skkni_map', label: 'Peta SKKNI' }],
    },
    {
      phaseKey: 'training_details',
      label: 'Detail Training',
      description: 'Informasi final untuk menyusun dokumen trainer.',
      fields: [
        {
          phaseKey: 'training_details',
          fieldKey: 'program_name',
          label: 'Nama program',
          optional: true,
        },
        {
          phaseKey: 'training_details',
          fieldKey: 'delivery_method',
          label: 'Metode pelaksanaan',
          optional: true,
        },
        {
          phaseKey: 'training_details',
          fieldKey: 'duration_jp',
          label: 'Durasi JP',
          optional: true,
        },
      ],
    },
  ],
}

export function getFieldState(
  readiness: InterviewReadiness | null,
  field: CheckpointField,
): ReadinessField | undefined {
  return readiness?.fields.find(
    (item) => item.phaseKey === field.phaseKey && item.fieldKey === field.fieldKey,
  )
}

export function getEffectiveStatus(
  readiness: InterviewReadiness | null,
  field: CheckpointField,
): FieldStatus | 'optional_missing' {
  const state = getFieldState(readiness, field)
  if (state?.status) return state.status
  return field.optional ? 'optional_missing' : 'missing'
}

export function getProgress(flow: AiFlow, readiness: InterviewReadiness | null) {
  const fields = checkpointConfig[flow]
    .flatMap((group) => group.fields)
    .filter((field) => !field.optional)
  if (!fields.length) return 0

  const completed = fields.filter((field) => {
    const status = getEffectiveStatus(readiness, field)
    return status === 'captured' || status === 'confirmed'
  }).length

  return Math.round((completed / fields.length) * 100)
}

export function formatFieldValue(value: unknown) {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return `${value.length} item`
  if (typeof value === 'object') return 'Terisi'
  return ''
}
