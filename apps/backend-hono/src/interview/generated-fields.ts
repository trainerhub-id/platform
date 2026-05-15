import type { FieldSnapshotFlow, FieldStateSnapshot } from "./field-state.types";

export type GeneratedFieldPatch = {
  flow: FieldSnapshotFlow;
  phaseKey: string;
  fieldKey: string;
  value: unknown;
};

function finalValue(states: FieldStateSnapshot[], phaseKey: string, fieldKey: string): unknown {
  const state = states.find((item) => item.phaseKey === phaseKey && item.fieldKey === fieldKey && ["captured", "confirmed"].includes(item.status));
  return state?.value;
}

function finalString(states: FieldStateSnapshot[], phaseKey: string, fieldKey: string): string {
  const value = finalValue(states, phaseKey, fieldKey);
  return typeof value === "string" ? value.trim() : "";
}

function hasValue(states: FieldStateSnapshot[], phaseKey: string, fieldKey: string): boolean {
  const value = finalValue(states, phaseKey, fieldKey);
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return !!value;
}

function allPresent(states: FieldStateSnapshot[], phaseKey: string, fields: string[]): boolean {
  return fields.every((fieldKey) => hasValue(states, phaseKey, fieldKey));
}

export function buildGeneratedFieldPatches(flow: FieldSnapshotFlow, states: FieldStateSnapshot[]): GeneratedFieldPatch[] {
  if (flow === "trainer") return buildTrainerGeneratedFieldPatches(states);
  return buildMasterGeneratedFieldPatches(states);
}

function buildTrainerGeneratedFieldPatches(states: FieldStateSnapshot[]): GeneratedFieldPatch[] {
  if (!allPresent(states, "brainstorming", ["trainer_name", "institution", "expertise", "audience", "outcome"])) return [];

  const expertise = finalString(states, "brainstorming", "expertise") || "AI GENERATED";
  const audience = finalString(states, "brainstorming", "audience") || "AI GENERATED";
  const patches: GeneratedFieldPatch[] = [];

  if (!hasValue(states, "training_details", "program_name")) {
    patches.push({ flow: "trainer", phaseKey: "training_details", fieldKey: "program_name", value: `Pelatihan ${expertise} untuk ${audience}` });
  }
  if (!hasValue(states, "training_details", "delivery_method")) {
    patches.push({ flow: "trainer", phaseKey: "training_details", fieldKey: "delivery_method", value: "AI GENERATED" });
  }
  if (!hasValue(states, "training_details", "duration_jp")) {
    patches.push({ flow: "trainer", phaseKey: "training_details", fieldKey: "duration_jp", value: 0 });
  }

  return patches;
}

function buildMasterGeneratedFieldPatches(states: FieldStateSnapshot[]): GeneratedFieldPatch[] {
  if (!allPresent(states, "profile", ["trainer_name", "organization_name", "organization_focus", "target_participants", "industry_problem", "program_goal", "training_location", "training_duration"])) return [];

  const focus = finalString(states, "profile", "organization_focus") || "AI GENERATED";
  const audience = finalString(states, "profile", "target_participants") || "AI GENERATED";
  const location = finalString(states, "profile", "training_location") || "AI GENERATED";
  const patches: GeneratedFieldPatch[] = [];

  if (!hasValue(states, "profile", "program_name")) {
    patches.push({ flow: "master", phaseKey: "profile", fieldKey: "program_name", value: `Pelatihan ${focus} untuk ${audience}` });
  }
  if (!hasValue(states, "profile", "organization_city")) {
    patches.push({ flow: "master", phaseKey: "profile", fieldKey: "organization_city", value: location });
  }

  return patches;
}
