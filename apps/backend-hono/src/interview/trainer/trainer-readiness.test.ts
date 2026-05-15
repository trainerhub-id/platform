import { describe, expect, it } from "vitest";
import type { FieldStateSnapshot } from "../field-state.types";
import { buildTrainerReadiness } from "./trainer-readiness";

const confirmed = (phaseKey: string, fieldKey: string, value: unknown): FieldStateSnapshot => ({
	flow: "trainer",
	phaseKey,
	fieldKey,
	status: "confirmed",
	value,
});

export const completeTrainerStates = (): FieldStateSnapshot[] => [
	confirmed("brainstorming", "trainer_name", "Budi"),
	confirmed("brainstorming", "expertise", "Digital Marketing"),
	confirmed("brainstorming", "audience", "Owner UMKM"),
	confirmed("brainstorming", "outcome", "Peserta mampu menjalankan kampanye digital"),
	confirmed("brainstorming", "institution", "PT Maju Jaya"),
	confirmed("unit_selection", "selected_unit_code", "M.70MKT00.001.1"),
	confirmed("unit_selection", "unit_detail", { elements: [{ element_text: "Menyiapkan kampanye" }] }),
	confirmed("competency_map", "skkni_map", { main_goal: "Kampanye digital efektif" }),
	confirmed("training_details", "program_name", "Pelatihan Digital Marketing"),
	confirmed("training_details", "delivery_method", "Offline"),
	confirmed("training_details", "duration_jp", 16),
];

describe("buildTrainerReadiness", () => {
	it("reports missing brainstorming, SKKNI, and training detail fields", () => {
		const readiness = buildTrainerReadiness([]);

		expect(readiness.ready).toBe(false);
		expect(readiness.missing).toContain("brainstorming.trainer_name");
		expect(readiness.missing).toContain("unit_selection.selected_unit_code");
		expect(readiness.missing).toContain("unit_selection.unit_detail");
		expect(readiness.missing).toContain("competency_map.skkni_map");
		expect(readiness.missing).toContain("training_details.duration_jp");
	});

	it("is ready when required Trainer fields are complete", () => {
		const readiness = buildTrainerReadiness(completeTrainerStates());

		expect(readiness.ready).toBe(true);
		expect(readiness.missing).toEqual([]);
	});

	it("keeps optional Trainer fields separate", () => {
		const readiness = buildTrainerReadiness(completeTrainerStates());

		expect(readiness.optionalGaps).toEqual([
			"brainstorming.activities",
			"brainstorming.training_objective",
			"brainstorming.training_date",
		]);
	});
});
