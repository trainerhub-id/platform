export const trainerBrainstormingRequiredFields = [
  'trainer_name',
  'institution',
  'expertise',
  'audience',
  'outcome',
] as const

export const trainerBrainstormingOptionalFields = [
  'activities',
  'training_objective',
  'training_date',
] as const

export const trainerTrainingDetailsGeneratedFields = [
  'program_name',
  'delivery_method',
  'duration_jp',
] as const

export const trainerSkkniRequiredFields = [
  { phaseKey: 'unit_selection', fieldKey: 'selected_unit_code' },
  { phaseKey: 'unit_selection', fieldKey: 'unit_detail' },
  { phaseKey: 'competency_map', fieldKey: 'skkni_map' },
] as const
