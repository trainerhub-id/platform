import { stepCountIs, streamText, tool } from 'ai'
import { z } from 'zod'
import { SkkniService } from '../skkni/skkni.service'
import { ModelService } from './model.service'
import { interviewerPrompt } from './prompts/interviewer.prompt'

export type ResponseInput = {
  message: string
  phase: string
  readiness: unknown
  nextField: string | null
  capturedFields?: Array<{ phaseKey: string; fieldKey: string; value: unknown }>
  missingFields?: string[]
  flow?: 'master' | 'trainer'
  masterJson?: unknown
  documentId?: string
  saveField?: (phaseKey: string, fieldKey: string, value: unknown) => Promise<void>
}

export interface ResponseServiceLike {
  stream(input: ResponseInput): Promise<Response>
}

const fieldLabels: Record<string, string> = {
  trainer_name: 'Nama trainer',
  institution: 'Institusi/lembaga',
  expertise: 'Bidang keahlian',
  audience: 'Target peserta',
  outcome: 'Hasil yang diinginkan',
  organization_name: 'Nama lembaga',
  organization_focus: 'Fokus/bidang pelatihan',
  target_participants: 'Target peserta',
  industry_problem: 'Masalah industri',
  program_goal: 'Tujuan program',
  training_location: 'Lokasi pelatihan',
  training_duration: 'Durasi pelatihan',
  activities: 'Aktivitas belajar',
  training_objective: 'Tujuan pelatihan',
  training_date: 'Tanggal pelatihan',
  program_name: 'Nama program',
  organization_city: 'Kota lembaga',
  delivery_method: 'Metode pelaksanaan',
  evaluation_methods: 'Metode evaluasi',
  duration_jp: 'Durasi (JP)',
}

function buildResponsePrompt(input: ResponseInput): string {
  const lines: string[] = []

  lines.push(`Flow: ${input.flow ?? 'unknown'}`)
  lines.push(`Phase: ${input.phase}`)
  lines.push(`User message: "${input.message}"`)
  lines.push('')

  if (input.capturedFields && input.capturedFields.length > 0) {
    lines.push('Informasi yang sudah dikumpulkan:')
    for (const field of input.capturedFields) {
      const label = fieldLabels[field.fieldKey] ?? field.fieldKey
      const value =
        typeof field.value === 'object' ? JSON.stringify(field.value) : String(field.value ?? '')
      lines.push(`- ${label}: ${value}`)
    }
    lines.push('')
  }

  const readiness = input.readiness as { missing?: string[]; ready?: boolean } | undefined
  const missing = input.missingFields ?? readiness?.missing ?? []
  if (missing.length > 0) {
    lines.push('Informasi yang masih dibutuhkan:')
    for (const key of missing) {
      const fieldKey = key.includes('.') ? (key.split('.')[1] ?? key) : key
      const label = fieldLabels[fieldKey] ?? key
      lines.push(`- ${label}`)
    }
    lines.push('')
  }

  if (readiness?.ready) {
    lines.push(
      'Semua informasi inti sudah lengkap. Tawarkan untuk mencari unit SKKNI yang relevan.',
    )
    lines.push('')
  }

  lines.push(
    'Berdasarkan konteks di atas, berikan respons dalam bahasa Indonesia yang natural, singkat, dan profesional.',
  )

  return lines.join('\n')
}

export class ResponseService implements ResponseServiceLike {
  constructor(
    private readonly modelService: Pick<ModelService, 'getLanguageModel'> = new ModelService(),
    private readonly skkni: Pick<SkkniService, 'searchMaster' | 'getUnitDetail' | 'getCompetencyMap'> = new SkkniService(),
  ) {}

  async stream(input: ResponseInput): Promise<Response> {
    const shouldSearchSkkni =
      input.phase === 'unit_selection' && isSearchConfirmation(input.message)

    // Detect unit code from message directly (e.g. "Aku pilih unit ini N.79JPW00.139.1")
    const unitCodeInMessage = extractUnitCodeFromMessage(input.message)
    // Also check capturedFields for already-saved unit code
    const selectedUnitCode = unitCodeInMessage ?? getSelectedUnitCode(input)
    // Trigger fetch when user explicitly picks a unit (any phase after brainstorming)
    const shouldFetchUnit =
      !shouldSearchSkkni &&
      selectedUnitCode !== null &&
      (unitCodeInMessage !== null ||
        (input.phase === 'competency_map' && isConfirmation(input.message)))

    const result = streamText({
      model: this.modelService.getLanguageModel(),
      system: interviewerPrompt,
      prompt: shouldSearchSkkni
        ? `${buildResponsePrompt(input)}\n\nUser sudah mengonfirmasi pencarian unit SKKNI. Panggil tool search_skkni_units, lalu tampilkan hasil sebagai daftar bernomor berisi kode unit, judul, dan skor singkat. Jika tidak ada hasil, minta kata kunci yang lebih spesifik.`
        : shouldFetchUnit
          ? `${buildResponsePrompt(input)}\n\nUser mengonfirmasi unit ${selectedUnitCode}. Panggil tool fetch_unit_detail sekarang untuk mengambil detail dan peta kompetensi unit tersebut, lalu tampilkan ringkasan elemen kompetensi dan KUK-nya.`
          : buildResponsePrompt(input),
      ...(shouldSearchSkkni
        ? {
            tools: {
              search_skkni_units: tool({
                description:
                  'Mencari kandidat unit SKKNI yang relevan berdasarkan konteks program pelatihan yang sudah dikumpulkan.',
                inputSchema: z.object({}),
                execute: async () => ({
                  candidates: await this.skkni.searchMaster(input.masterJson),
                }),
              }),
            },
            toolChoice: 'auto' as const,
            stopWhen: stepCountIs(2),
            providerOptions: {
              deepseek: { thinking: { type: 'disabled' } },
            },
          }
        : shouldFetchUnit
          ? {
              tools: {
                fetch_unit_detail: tool({
                  description: 'Mengambil detail unit SKKNI dan peta kompetensinya dari WSP.',
                  inputSchema: z.object({}),
                  execute: async () => {
                    const [detail, map] = await Promise.all([
                      this.skkni.getUnitDetail(selectedUnitCode),
                      this.skkni.getCompetencyMap(selectedUnitCode).catch(() => null),
                    ])
                    // Save directly to field states so readiness advances
                    if (input.saveField) {
                      await input.saveField('unit_selection', 'unit_detail', detail)
                      if (map) {
                        await input.saveField('competency_map', 'skkni_map', map)
                      }
                    }
                    return { unitCode: selectedUnitCode, detail, map }
                  },
                }),
              },
              toolChoice: 'auto' as const,
              stopWhen: stepCountIs(2),
              providerOptions: {
                deepseek: { thinking: { type: 'disabled' } },
              },
            }
          : {}),
    })

    return result.toTextStreamResponse()
  }
}

function isSearchConfirmation(message: string): boolean {
  const trimmed = message.trim().toLowerCase()
  // Match any message that starts with a confirmation word and is short (no question, no unit code)
  return /^(?:ya+h?|iya+h?|yes+|y+|ok+e*|oke+y*|setuju|lanjut(?:kan)?|siap|gas|boleh|silakan|silahkan)(?:\s+\S+){0,3}$/i.test(trimmed) &&
    !trimmed.includes('?') &&
    !/[A-Z]\.\d{2}/.test(message) // not a unit code selection
}

function isConfirmation(message: string): boolean {
  return /^(?:ya+a*|iya+h*|yes+|y+|ok+e*|oke+y*|setuju|lanjut|lanjutkan|siap|gas|boleh|pakai|pake|gunakan|konfirmasi)(?:\s+\S*)?$/i.test(
    message.trim(),
  )
}

function extractUnitCodeFromMessage(message: string): string | null {
  const match = message.match(/[A-Z]\.\d{2}[A-Z0-9]+\.\d{3}\.\d+/)
  return match ? match[0] : null
}

function getSelectedUnitCode(input: ResponseInput): string | null {
  if (!input.capturedFields) return null
  const field = input.capturedFields.find(
    (f) => f.phaseKey === 'unit_selection' && f.fieldKey === 'selected_unit_code',
  )
  return typeof field?.value === 'string' ? field.value : null
}
