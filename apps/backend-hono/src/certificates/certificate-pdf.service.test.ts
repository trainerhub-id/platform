import { describe, expect, it } from "vitest";
import { CertificatePdfService } from "./certificate-pdf.service";

describe("CertificatePdfService", () => {
	it("renders a certificate PDF with ReactPDF", async () => {
		const service = new CertificatePdfService({
			createDocument: async (input) => ({ kind: "doc", input }),
			renderToBuffer: async (document) => {
				const typed = document as { input: { certificateNumber: string } };
				return Buffer.from(`pdf:${typed.input.certificateNumber}`);
			},
		});

		const pdf = await service.render({
			pesertaName: "Budi",
			courseName: "Digital Marketing",
			certificateNumber: "TRH-2026-DIG-00001",
			completedAt: new Date("2026-05-01T00:00:00.000Z"),
			issuedAt: new Date("2026-05-02T00:00:00.000Z"),
			trainerName: "TrainerHub Team",
			qrCodeDataUri: "data:image/png;base64,abc",
		});

		expect(pdf.toString()).toBe("pdf:TRH-2026-DIG-00001");
	});
});
