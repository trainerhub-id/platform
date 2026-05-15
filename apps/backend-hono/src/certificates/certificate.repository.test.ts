import { describe, expect, it } from "vitest";
import { buildCertificateNumber, mapCertificateListItem, mapValidationResult } from "./certificate.repository";

describe("certificate repository helpers", () => {
	it("builds TrainerHub certificate numbers", () => {
		expect(buildCertificateNumber({ year: 2026, courseTitle: "Digital Marketing", sequence: 7 })).toBe("TRH-2026-DIG-00007");
	});

	it("maps validation response", async () => {
		const result = await mapValidationResult(
			{
				certificateNumber: "TRH-2026-DIG-00007",
				pesertaName: "Budi",
				courseName: "Digital Marketing",
				completedAt: new Date("2026-05-01T00:00:00.000Z"),
				createdAt: new Date("2026-05-02T00:00:00.000Z"),
				status: "issued",
				fileUrl: "certificates/budi.pdf",
			},
			async (key) => `https://files.example/${key}`,
		);

		expect(result).toEqual({
			valid: true,
			certificateNumber: "TRH-2026-DIG-00007",
			pesertaName: "Budi",
			courseName: "Digital Marketing",
			completedAt: new Date("2026-05-01T00:00:00.000Z"),
			issuedAt: new Date("2026-05-02T00:00:00.000Z"),
			status: "issued",
			pdfUrl: "https://files.example/certificates/budi.pdf",
		});
	});

	it("maps certificate list item", async () => {
		const item = await mapCertificateListItem(
			{
				id: "cert_1",
				certificateNumber: "TRH-2026-DIG-00007",
				courseName: "Digital Marketing",
				completedAt: new Date("2026-05-01T00:00:00.000Z"),
				createdAt: new Date("2026-05-02T00:00:00.000Z"),
				status: "issued",
				fileUrl: null,
			},
			async (key) => `https://files.example/${key}`,
		);

		expect(item.id).toBe("cert_1");
		expect(item.pdfUrl).toBeNull();
	});
});
