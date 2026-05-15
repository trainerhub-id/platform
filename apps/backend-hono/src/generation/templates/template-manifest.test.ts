import { describe, expect, it } from "vitest";
import { getTemplateManifestEntry, templateManifest } from "./template-manifest";

describe("templateManifest", () => {
	it("contains master bukti-1 through bukti-8", () => {
		const masterTypes = templateManifest.filter((entry) => entry.flow === "master").map((entry) => entry.documentType);

		expect(masterTypes).toEqual(["bukti-1", "bukti-2", "bukti-3", "bukti-4", "bukti-5", "bukti-6", "bukti-7", "bukti-8"]);
	});

	it("migrates bukti-1 to programmatic docx renderer", () => {
		const bukti1 = getTemplateManifestEntry("bukti-1");

		expect(bukti1?.version).toBe("hono-programmatic-v1");
		expect(bukti1?.renderer).toBe("programmatic-docx");
	});

	it("migrates all master bukti documents to the programmatic docx renderer", () => {
		for (const documentType of ["bukti-1", "bukti-2", "bukti-3", "bukti-4", "bukti-5", "bukti-6", "bukti-7", "bukti-8"]) {
			const entry = getTemplateManifestEntry(documentType);

			expect(entry?.version).toBe("hono-programmatic-v1");
			expect(entry?.renderer).toBe("programmatic-docx");
			expect(entry?.outputFormat).toBe("docx");
		}
	});
});
