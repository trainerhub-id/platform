import type { FieldStateSnapshot } from "./field-state.types";
import { masterProfileRequiredFields } from "./master/master-fields";
import { trainerBrainstormingRequiredFields, trainerSkkniRequiredFields, trainerTrainingDetailsRequiredFields } from "./trainer/trainer-fields";

export type MasterPhase = "profile" | "unit_selection" | "competency_map" | "generation_ready";
export type TrainerPhase = "brainstorming" | "unit_selection" | "competency_map" | "training_details" | "generation_ready";

function hasFinalValue(states: FieldStateSnapshot[], phaseKey: string, fieldKey: string): boolean {
  const state = states.find((item) => item.phaseKey === phaseKey && item.fieldKey === fieldKey);
  if (!state || !["captured", "confirmed"].includes(state.status)) return false;
  if (typeof state.value === "string") return state.value.trim().length > 0;
  if (Array.isArray(state.value)) return state.value.length > 0;
  if (state.value && typeof state.value === "object") return Object.keys(state.value).length > 0;
  return !!state.value;
}

export function getNextMasterPhase(states: FieldStateSnapshot[]): MasterPhase {
  const profileComplete = masterProfileRequiredFields.every((fieldKey) => hasFinalValue(states, "profile", fieldKey));
  if (!profileComplete) return "profile";

  const unitComplete =
    hasFinalValue(states, "unit_selection", "selected_unit_code") &&
    hasFinalValue(states, "unit_selection", "unit_detail");
  if (!unitComplete) return "unit_selection";

  if (!hasFinalValue(states, "competency_map", "skkni_map")) return "competency_map";

  return "generation_ready";
}

export function getNextTrainerPhase(states: FieldStateSnapshot[]): TrainerPhase {
  const brainstormingComplete = trainerBrainstormingRequiredFields.every((fieldKey) =>
    hasFinalValue(states, "brainstorming", fieldKey),
  );
  if (!brainstormingComplete) return "brainstorming";

  const unitComplete = trainerSkkniRequiredFields
    .filter((requirement) => requirement.phaseKey === "unit_selection")
    .every((requirement) => hasFinalValue(states, requirement.phaseKey, requirement.fieldKey));
  if (!unitComplete) return "unit_selection";

  if (!hasFinalValue(states, "competency_map", "skkni_map")) return "competency_map";

  const trainingDetailsComplete = trainerTrainingDetailsRequiredFields.every((fieldKey) =>
    hasFinalValue(states, "training_details", fieldKey),
  );
  if (!trainingDetailsComplete) return "training_details";

  return "generation_ready";
}
