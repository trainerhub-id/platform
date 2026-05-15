import { describe, expect, it } from "vitest";
import { buildCertificatePath, buildPesertaSertifikatPath, getExtensionForMimeType, ObjectStorageService, sanitizeObjectFilename } from "./object-storage.service";

describe("object storage helpers", () => {
	it("sanitizes object filenames", () => {
		expect(sanitizeObjectFilename("sertifikat final!!.pdf")).toBe("sertifikat_final__.pdf");
	});

	it("maps common mime types to extensions", () => {
		expect(getExtensionForMimeType("application/pdf")).toBe(".pdf");
		expect(getExtensionForMimeType("image/jpeg")).toBe(".jpg");
		expect(getExtensionForMimeType("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(".docx");
	});

	it("builds legacy-compatible certificate paths", () => {
		expect(buildPesertaSertifikatPath("peserta_1")).toBe("storage/peserta/peserta_1/sertifikat");
		expect(buildCertificatePath("peserta_1", "course_1")).toBe("storage/peserta/peserta_1/certificates/course_1");
	});
});

describe("ObjectStorageService", () => {
	it("uploads a buffer to S3-compatible storage and returns signed URL", async () => {
		const sent: unknown[] = [];
		const storage = new ObjectStorageService({
			bucket: "trainerhub-storage",
			publicUrl: undefined,
			maxFileSizeMB: 1,
			client: {
				send: async (command: unknown) => {
					sent.push(command);
					return {};
				},
			},
			sign: async (_client, command) => `signed:${command.input.Key}`,
			now: () => 123,
		});

		const result = await storage.uploadBuffer(Buffer.from("pdf"), "storage/peserta/p1/certificates/c1", "application/pdf");

		expect(result).toEqual({ key: "storage/peserta/p1/certificates/c1/123.pdf", url: "signed:storage/peserta/p1/certificates/c1/123.pdf" });
		expect(sent).toHaveLength(1);
	});

	it("uses public URL when configured", async () => {
		const storage = new ObjectStorageService({
			bucket: "trainerhub-storage",
			publicUrl: "https://cdn.example.com",
			client: { send: async () => ({}) },
			sign: async () => "signed",
		});

		expect(await storage.getPublicUrl("a/b.pdf")).toBe("https://cdn.example.com/a/b.pdf");
	});

	it("rejects buffers over max file size", async () => {
		const storage = new ObjectStorageService({ bucket: "trainerhub-storage", maxFileSizeMB: 0.000001, client: { send: async () => ({}) }, sign: async () => "signed" });

		await expect(storage.uploadBuffer(Buffer.from("too-large"), "path", "application/pdf")).rejects.toThrow(/exceeds/);
	});
});
