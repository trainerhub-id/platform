import type { FieldStateSnapshot } from './field-state.types'

function finalValue(states: FieldStateSnapshot[], phaseKey: string, fieldKey: string): unknown {
  return states.find(
    (state) =>
      state.phaseKey === phaseKey &&
      state.fieldKey === fieldKey &&
      ['captured', 'confirmed'].includes(state.status),
  )?.value
}

function finalString(
  states: FieldStateSnapshot[],
  phaseKey: string,
  fieldKey: string,
): string | undefined {
  const value = finalValue(states, phaseKey, fieldKey)
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function hasObject(states: FieldStateSnapshot[], phaseKey: string, fieldKey: string): boolean {
  const value = finalValue(states, phaseKey, fieldKey)
  return (
    !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0
  )
}

export function buildMasterProfilePatchFromStates(states: FieldStateSnapshot[]) {
  return {
    organizationName: finalString(states, 'profile', 'organization_name'),
    trainerName: finalString(states, 'profile', 'trainer_name'),
    organizationCity: finalString(states, 'profile', 'organization_city'),
    organizationFocus: finalString(states, 'profile', 'organization_focus'),
    programName: finalString(states, 'profile', 'program_name'),
    programGoal: finalString(states, 'profile', 'program_goal'),
    targetParticipants: finalString(states, 'profile', 'target_participants'),
    industryProblem: finalString(states, 'profile', 'industry_problem'),
    trainingLocation: finalString(states, 'profile', 'training_location'),
    trainingDuration: finalString(states, 'profile', 'training_duration'),
    deliveryMethod: finalString(states, 'profile', 'delivery_method'),
    evaluationMethods: finalString(states, 'profile', 'evaluation_methods'),
    selectedUnitCode: finalString(states, 'unit_selection', 'selected_unit_code'),
    selectedUnitTitle: finalString(states, 'unit_selection', 'selected_unit_title'),
    skkniMapReady: hasObject(states, 'competency_map', 'skkni_map'),
    unitDetailReady: hasObject(states, 'unit_selection', 'unit_detail'),
    updatedAt: new Date(),
  }
}
