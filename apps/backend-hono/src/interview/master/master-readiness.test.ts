import { describe, expect, it } from "vitest";
import type { FieldStateSnapshot } from "../field-state.types";
import { buildMasterReadiness } from "./master-readiness";

const confirmed = (phaseKey: string, fieldKey: string, value: unknown): FieldStateSnapshot => ({
  flow: "master",
  phaseKey,
  fieldKey,
  status: "confirmed",
  value,
});

describe("buildMasterReadiness", () => {
  it("reports missing profile and SKKNI fields", () => {
    const readiness = buildMasterReadiness([]);

    expect(readiness.ready).toBe(false);
    expect(readiness.missing).toContain("profile.organization_name");
    expect(readiness.missing).toContain("unit_selection.selected_unit_code");
    expect(readiness.missing).toContain("competency_map.skkni_map");
    expect(readiness.missing).toContain("unit_selection.unit_detail");
  });

  it("is ready when profile, SKKNI map, and unit detail are complete", () => {
    const states: FieldStateSnapshot[] = [
      confirmed("profile", "organization_name", "PT Maju Jaya"),
      confirmed("profile", "trainer_name", "Budi"),
      confirmed("profile", "organization_city", "Bekasi"),
      confirmed("profile", "organization_focus", "Digital Marketing"),
      confirmed("profile", "program_name", "Pelatihan Digital Marketing untuk UMKM"),
      confirmed("profile", "program_goal", "Meningkatkan penjualan melalui digital marketing"),
      confirmed("profile", "target_participants", "Owner UMKM"),
      confirmed("profile", "industry_problem", "Iklan boros tapi hasil minim"),
      confirmed("profile", "training_location", "Bekasi"),
      confirmed("profile", "training_duration", "2 hari"),
      confirmed("unit_selection", "selected_unit_code", "M.70MKT00.001.1"),
      confirmed("unit_selection", "unit_detail", { elements: [{ title: "Menyiapkan kampanye" }] }),
      confirmed("competency_map", "skkni_map", { main_goal: "Digital marketing efektif" }),
    ];

    const readiness = buildMasterReadiness(states);

    expect(readiness.ready).toBe(true);
    expect(readiness.missing).toEqual([]);
  });

  it("keeps pending suggestions out of readiness", () => {
    const readiness = buildMasterReadiness([
      {
        flow: "master",
        phaseKey: "profile",
        fieldKey: "organization_name",
        status: "pending_confirmation",
        value: null,
      },
    ]);

    expect(readiness.ready).toBe(false);
    expect(readiness.pendingConfirmation).toContain("profile.organization_name");
  });
});
