import { describe, expect, it } from "vitest";
import { CertificateService } from "./certificate.service";

describe("BNSP certificate migration", () => {
	it("uploads a BNSP certificate to object storage and creates row", async () => {
		const created: unknown[] = [];
		const service = new CertificateService({
			repository: {
				findPesertaById: async () => ({ id: "peserta_1", nama: "Budi" }),
				findBnspByPeserta: async () => null,
				createBnspCertificate: async (input: unknown) => {
					created.push(input);
					return { id: "bnsp_1", ...(input as object), createdAt: new Date("2026-05-02T00:00:00.000Z"), status: "issued" };
				},
			} as any,
			storage: {
				upload: async (file: { originalname: string }, path: string) => ({ key: `${path}/123-${file.originalname}`, url: "signed" }),
				getPublicUrl: async (key: string) => `https://files.example/${key}`,
				buildPesertaSertifikatPath: (pesertaId: string) => `storage/peserta/${pesertaId}/sertifikat`,
				buildCertificatePath: (pesertaId: string, courseId: string) => `storage/peserta/${pesertaId}/certificates/${courseId}`,
			} as any,
		});

		const cert = await service.uploadBnspCertificate(
			{ originalname: "bnsp.pdf", buffer: Buffer.from("pdf"), mimetype: "application/pdf", size: 3 },
			{ pesertaId: "peserta_1", nomorSertifikat: "BNSP-001", lsp: "LSP TrainerHub" },
		);

		expect(created).toHaveLength(1);
		expect(cert.fileUrl).toBe("storage/peserta/peserta_1/sertifikat/123-bnsp.pdf");
		expect(cert.nomorSertifikat).toBe("BNSP-001");
	});
});
