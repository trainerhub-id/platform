import type { FieldStateSnapshot } from '../field-state.types'

function isFinalState(state: FieldStateSnapshot): boolean {
  return ['captured', 'confirmed'].includes(state.status)
}

function getValue(states: FieldStateSnapshot[], phaseKey: string, fieldKey: string): unknown {
  return states.find(
    (state) => state.phaseKey === phaseKey && state.fieldKey === fieldKey && isFinalState(state),
  )?.value
}

function getString(states: FieldStateSnapshot[], phaseKey: string, fieldKey: string): string {
  const value = getValue(states, phaseKey, fieldKey)
  return typeof value === 'string' ? value.trim() : ''
}

function getNumber(states: FieldStateSnapshot[], phaseKey: string, fieldKey: string): number {
  const value = getValue(states, phaseKey, fieldKey)
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function getObject(
  states: FieldStateSnapshot[],
  phaseKey: string,
  fieldKey: string,
): Record<string, unknown> {
  const value = getValue(states, phaseKey, fieldKey)
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function compileTrainerJson(states: FieldStateSnapshot[]) {
  const unitDetail = getObject(states, 'unit_selection', 'unit_detail')
  const selectedUnitCode = getString(states, 'unit_selection', 'selected_unit_code')
  const selectedUnitTitle = getString(states, 'unit_selection', 'selected_unit_title')
  const trainerName = getString(states, 'brainstorming', 'trainer_name')
  const durationJp = getNumber(states, 'training_details', 'duration_jp')

  return {
    schema_key: 'hono_trainer_alpha_v1',
    brainstorming: {
      trainer_name: trainerName,
      expertise: getString(states, 'brainstorming', 'expertise'),
      activities: getString(states, 'brainstorming', 'activities'),
      audience: getString(states, 'brainstorming', 'audience'),
      outcome: getString(states, 'brainstorming', 'outcome'),
      training_objective: getString(states, 'brainstorming', 'training_objective'),
      training_date: getString(states, 'brainstorming', 'training_date'),
      institution: getString(states, 'brainstorming', 'institution'),
    },
    training_details: {
      program_name: getString(states, 'training_details', 'program_name'),
      delivery_method: getString(states, 'training_details', 'delivery_method'),
      duration_jp: durationJp,
    },
    training: {
      name: getString(states, 'training_details', 'program_name'),
      delivery_method: getString(states, 'training_details', 'delivery_method'),
      duration: {
        total_jp: durationJp,
        jp_minutes: 45,
        total_minutes: durationJp * 45,
        text: durationJp > 0 ? `${durationJp} JP (${durationJp * 45} menit)` : '',
      },
    },
    people: {
      trainer: { name: trainerName },
    },
    unit: {
      ...unitDetail,
      code: selectedUnitCode,
      name: selectedUnitTitle || String(unitDetail.name || unitDetail.title || ''),
    },
    competency_map: getObject(states, 'competency_map', 'skkni_map'),
  }
}
