import { env } from '../config/env'

export type MasterSkkniContext = {
  expertise?: string | undefined
  activities?: string | undefined
  audience?: string | undefined
  outcome?: string | undefined
  domain_hint?: string | undefined
  inferred_goal_label?: string | undefined
}

export type SkkniCandidate = {
  id: string
  unitCode: string
  title: string
  relevanceScore: number
  reason: string
  evidence: string[]
}

type SemanticSearchResponse = {
  results?: Array<{
    rank?: number
    unit_code: string
    document_id?: string
    unit_title: string
    unit_description?: string
    score?: number
    rerank_score?: number
    confidence?: string
    match_type?: string
  }>
}

type WspUnitData = {
  unit_code: string
  unit_title: string
  unit_description?: string
  competency_elements?: Array<{
    element_number: number
    element_title: string
    performance_criteria?: Array<{ code: string; description: string }>
  }>
  variable_constraints?: unknown
  assessment_guide?: unknown
  number?: string
  number_kepmen?: string
  source_signature?: { document_id?: string; document_title?: string }
}

type CompetencyMapApi = {
  tujuan_utama?: string | null
  fungsi_kunci?: string | null
  fungsi_utama?: string | null
  sub_fungsi_utama?: string | null
  matched_fungsi_dasar?: string | null
}

function clean(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

export function buildSkkniContext(masterJson: unknown): MasterSkkniContext {
  const root =
    masterJson && typeof masterJson === 'object' ? (masterJson as Record<string, unknown>) : {}
  const master = (root.brainstorming_master ?? {}) as Record<string, unknown>
  const trainer = (root.brainstorming ?? {}) as Record<string, unknown>

  if (
    root.schema_key === 'hono_trainer_alpha_v1' ||
    trainer.expertise ||
    trainer.audience ||
    trainer.outcome
  ) {
    return {
      expertise: clean(trainer.expertise),
      activities: clean(trainer.outcome) ?? clean(trainer.training_objective),
      audience: clean(trainer.audience),
      outcome: clean(trainer.outcome) ?? clean(trainer.training_objective),
      domain_hint: clean(trainer.expertise),
      inferred_goal_label: clean(trainer.outcome) ?? clean(trainer.training_objective),
    }
  }

  return {
    expertise: clean(master.organization_focus) ?? clean(master.program_name),
    activities: clean(master.program_goal),
    audience: clean(master.target_participants),
    outcome: clean(master.program_goal) ?? clean(master.industry_problem),
    domain_hint: clean(master.program_name) ?? clean(master.organization_focus),
    inferred_goal_label: clean(master.program_goal),
  }
}

export const buildMasterSkkniContext = buildSkkniContext

export function transformSemanticSearch(response: SemanticSearchResponse): SkkniCandidate[] {
  return (response.results ?? []).slice(0, 10).map((item, index) => ({
    id: item.document_id ? `${item.document_id}:${item.unit_code}` : item.unit_code,
    unitCode: item.unit_code,
    title: item.unit_title,
    relevanceScore: Number(item.rerank_score ?? item.score ?? 0),
    reason:
      [item.confidence, item.match_type, item.unit_description].filter(Boolean).join(' — ') ||
      'Relevan dengan konteks program.',
    evidence: [
      `Rank ${item.rank ?? index + 1}`,
      item.document_id ? `Dokumen ${item.document_id}` : '',
    ].filter(Boolean),
  }))
}

export function normalizeUnitDetail(data: WspUnitData) {
  return {
    code: data.unit_code,
    name: data.unit_title,
    description: data.unit_description ?? '',
    number: data.number ?? '',
    number_kepmen: data.number_kepmen ?? '',
    source_document: {
      document_id: data.source_signature?.document_id ?? '',
      document_title: data.source_signature?.document_title ?? '',
    },
    variable_constraints: data.variable_constraints ?? {},
    assessment_guide: data.assessment_guide ?? {},
    elements: (data.competency_elements ?? []).map((element) => ({
      element_number: element.element_number,
      element_text: element.element_title,
      kuk: (element.performance_criteria ?? []).map((criteria) => ({
        kuk_code: criteria.code,
        kuk_text: criteria.description,
      })),
    })),
  }
}

export function normalizeCompetencyMap(data: CompetencyMapApi) {
  return {
    main_goal: data.tujuan_utama ?? '',
    key_function: data.fungsi_kunci ?? '',
    main_function: data.fungsi_utama ?? '',
    basic_function: data.sub_fungsi_utama ?? data.matched_fungsi_dasar ?? '',
  }
}

export class SkkniService {
  constructor(private readonly baseUrl = env.WSP_API_URL) {}

  async searchMaster(masterJson: unknown): Promise<SkkniCandidate[]> {
    const context = buildSkkniContext(masterJson)
    const payload = {
      ...context,
      query_text: [context.expertise, context.activities, context.audience, context.outcome]
        .filter(Boolean)
        .join(' dan '),
      top_k: 10,
      debug: false,
      include_explanations: true,
    }

    const response = await fetch(`${this.baseUrl}/search/semantic`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(`SKKNI_SEARCH_FAILED_${response.status}`)
    return transformSemanticSearch((await response.json()) as SemanticSearchResponse)
  }

  async getUnitDetail(unitCode: string) {
    const response = await fetch(`${this.baseUrl}/unit/${encodeURIComponent(unitCode)}`, {
      headers: { accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`SKKNI_UNIT_FAILED_${response.status}`)
    const json = (await response.json()) as { success?: boolean; data?: WspUnitData } | WspUnitData
    const data = 'data' in json && json.data ? json.data : (json as WspUnitData)
    return normalizeUnitDetail(data)
  }

  async getCompetencyMap(unitCode: string) {
    const response = await fetch(`${this.baseUrl}/map/${encodeURIComponent(unitCode)}`, {
      headers: { accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`SKKNI_MAP_FAILED_${response.status}`)
    return normalizeCompetencyMap((await response.json()) as CompetencyMapApi)
  }
}
