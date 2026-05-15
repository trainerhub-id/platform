import type { FieldStateSnapshot } from "../field-state.types";

type CompiledMasterJson = {
  schema_key: string;
  brainstorming_master: Record<string, string>;
  training: {
    name: string;
    objective: string;
    delivery_method: string;
    duration: { text: string };
    location_text: string;
  };
  organizer: { name: string };
  people: { trainer: { name: string } };
  unit: Record<string, unknown> & { code: string; name: string };
  competency_map: Record<string, unknown>;
};

function isFinalState(state: FieldStateSnapshot): boolean {
  return ["captured", "confirmed"].includes(state.status);
}

function getValue(states: FieldStateSnapshot[], phaseKey: string, fieldKey: string): unknown {
  return states.find((state) => state.phaseKey === phaseKey && state.fieldKey === fieldKey && isFinalState(state))?.value;
}

function getString(states: FieldStateSnapshot[], phaseKey: string, fieldKey: string): string {
  const value = getValue(states, phaseKey, fieldKey);
  return typeof value === "string" ? value.trim() : "";
}

function getObject(states: FieldStateSnapshot[], phaseKey: string, fieldKey: string): Record<string, unknown> {
  const value = getValue(states, phaseKey, fieldKey);
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function compileMasterJson(states: FieldStateSnapshot[]): CompiledMasterJson {
  const unitDetail = getObject(states, "unit_selection", "unit_detail");
  const selectedUnitCode = getString(states, "unit_selection", "selected_unit_code");
  const selectedUnitTitle = getString(states, "unit_selection", "selected_unit_title");
  const trainerName = getString(states, "profile", "trainer_name");

  return {
    schema_key: "hono_master_alpha_v1",
    brainstorming_master: {
      organization_name: getString(states, "profile", "organization_name"),
      trainer_name: trainerName,
      organization_city: getString(states, "profile", "organization_city"),
      organization_focus: getString(states, "profile", "organization_focus"),
      program_name: getString(states, "profile", "program_name"),
      program_goal: getString(states, "profile", "program_goal"),
      target_participants: getString(states, "profile", "target_participants"),
      industry_problem: getString(states, "profile", "industry_problem"),
      training_location: getString(states, "profile", "training_location"),
      training_duration: getString(states, "profile", "training_duration"),
      delivery_method: getString(states, "profile", "delivery_method"),
      evaluation_methods: getString(states, "profile", "evaluation_methods"),
    },
    training: {
      name: getString(states, "profile", "program_name"),
      objective: getString(states, "profile", "program_goal"),
      delivery_method: getString(states, "profile", "delivery_method"),
      duration: {
        text: getString(states, "profile", "training_duration"),
      },
      location_text: getString(states, "profile", "training_location"),
    },
    organizer: {
      name: getString(states, "profile", "organization_name"),
    },
    people: {
      trainer: {
        name: trainerName,
      },
    },
    unit: {
      ...unitDetail,
      code: selectedUnitCode,
      name: selectedUnitTitle || String(unitDetail.name || unitDetail.title || ""),
    },
    competency_map: getObject(states, "competency_map", "skkni_map"),
  };
}
