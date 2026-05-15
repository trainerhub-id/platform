import { describe, expect, it } from "vitest";
import type { FieldStateSnapshot } from "../field-state.types";
import { compileMasterJson } from "./master-json-compiler";

const captured = (phaseKey: string, fieldKey: string, value: unknown): FieldStateSnapshot => ({
  flow: "master",
  phaseKey,
  fieldKey,
  status: "captured",
  value,
});

describe("compileMasterJson", () => {
  it("compiles profile and SKKNI state into master_json", () => {
    const result = compileMasterJson([
      captured("profile", "organization_name", "PT Maju Jaya"),
      captured("profile", "trainer_name", "Budi"),
      captured("profile", "program_name", "Pelatihan Digital Marketing"),
      captured("unit_selection", "selected_unit_code", "M.70MKT00.001.1"),
      captured("unit_selection", "selected_unit_title", "Mengelola Kampanye Digital"),
      captured("unit_selection", "unit_detail", { elements: [{ element_text: "Menyiapkan kampanye" }] }),
      captured("competency_map", "skkni_map", { main_goal: "Kampanye digital efektif" }),
    ]);

    expect(result.brainstorming_master.organization_name).toBe("PT Maju Jaya");
    expect(result.brainstorming_master.program_name).toBe("Pelatihan Digital Marketing");
    expect(result.people.trainer.name).toBe("Budi");
    expect(result.unit.code).toBe("M.70MKT00.001.1");
    expect(result.unit.name).toBe("Mengelola Kampanye Digital");
    expect(result.unit.elements).toEqual([{ element_text: "Menyiapkan kampanye" }]);
    expect(result.competency_map.main_goal).toBe("Kampanye digital efektif");
  });

  it("ignores pending confirmation as final values", () => {
    const result = compileMasterJson([
      {
        flow: "master",
        phaseKey: "profile",
        fieldKey: "program_name",
        status: "pending_confirmation",
        value: "Pelatihan Belum Final",
      },
    ]);

    expect(result.brainstorming_master.program_name).toBe("");
  });
});
