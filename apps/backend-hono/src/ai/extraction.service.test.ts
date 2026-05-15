import { describe, expect, it } from "vitest";
import { extractExplicitMessagePatches, normalizeExtractionObject } from "./extraction.service";

describe("normalizeExtractionObject", () => {
	it("accepts schema-native extraction output", () => {
		const result = normalizeExtractionObject({
			patches: [
				{
					flow: "master",
					phaseKey: "profile",
					fieldKey: "organization_name",
					value: "PT Maju Jaya",
					source: "user_explicit",
				},
			],
			pendingSuggestions: [],
			confirmedPendingFields: [],
			generateConfirmed: false,
		});

		expect(result.patches[0]?.fieldKey).toBe("organization_name");
	});

	it("normalizes DeepSeek JSON-patch style institutionName and trainerName for Master", () => {
		const result = normalizeExtractionObject({
			patches: [
				{ op: "replace", path: "/institutionName", value: "PT Maju Jaya" },
				{ op: "replace", path: "/trainerName", value: "Budi Santoso" },
			],
		});

		expect(result.patches).toEqual([
			{
				flow: "master",
				phaseKey: "profile",
				fieldKey: "organization_name",
				value: "PT Maju Jaya",
				source: "user_explicit",
				confidence: 0.8,
			},
			{
				flow: "master",
				phaseKey: "profile",
				fieldKey: "trainer_name",
				value: "Budi Santoso",
				source: "user_explicit",
				confidence: 0.8,
			},
		]);
	});

	it("normalizes common trainer fields for Trainer flow", () => {
		const result = normalizeExtractionObject(
			{
				patches: [
					{ op: "replace", path: "/trainerName", value: "Budi Santoso" },
					{ op: "replace", path: "/expertise", value: "Digital Marketing" },
					{ op: "replace", path: "/audience", value: "Owner UMKM" },
					{ op: "replace", path: "/durationJp", value: 16 },
				],
			},
			"trainer",
		);

		expect(result.patches.map((patch) => `${patch.phaseKey}.${patch.fieldKey}`)).toEqual([
			"brainstorming.trainer_name",
			"brainstorming.expertise",
			"brainstorming.audience",
			"training_details.duration_jp",
		]);
		expect(result.patches.every((patch) => patch.flow === "trainer")).toBe(true);
	});

	it("extracts explicit trainer name and expertise from Indonesian chat text", () => {
		const result = extractExplicitMessagePatches("Nama pelatih Ujang. Bidang keahlian utama Digital Marketing.", "trainer");

		expect(result).toMatchObject([
			{
				flow: "trainer",
				phaseKey: "brainstorming",
				fieldKey: "trainer_name",
				value: "Ujang",
			},
			{
				flow: "trainer",
				phaseKey: "brainstorming",
				fieldKey: "expertise",
				value: "Digital Marketing",
			},
		]);
	});
});
