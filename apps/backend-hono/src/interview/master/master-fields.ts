export const masterProfileRequiredFields = [
  "organization_name",
  "trainer_name",
  "organization_city",
  "organization_focus",
  "program_name",
  "program_goal",
  "target_participants",
  "industry_problem",
  "training_location",
  "training_duration",
] as const;

export const masterProfileOptionalFields = ["delivery_method", "evaluation_methods"] as const;

export const masterSkkniRequiredFields = [
  { phaseKey: "unit_selection", fieldKey: "selected_unit_code" },
  { phaseKey: "unit_selection", fieldKey: "unit_detail" },
  { phaseKey: "competency_map", fieldKey: "skkni_map" },
] as const;

export type MasterProfileRequiredField = (typeof masterProfileRequiredFields)[number];
export type MasterProfileOptionalField = (typeof masterProfileOptionalFields)[number];
