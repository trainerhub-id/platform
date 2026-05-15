import { describe, expect, it } from "vitest";
import { DocumentGeneratorService, GenerationValidationError } from "./document-generator.service";

describe("DocumentGeneratorService", () => {
	it("does not save snapshot or render when document is not ready", async () => {
		let snapshots = 0;
		let renders = 0;
		const service = new DocumentGeneratorService({
			payloadSnapshots: {
				save: async () => {
					snapshots += 1;
					return { id: "snapshot_1", documentId: "doc_1", flow: "master", documentType: "bukti-1", payload: {}, payloadHash: "hash", schemaVersion: "test", createdAt: new Date() };
				},
			},
			rendererRegistry: {
				getRenderer: () => ({
					supports: () => true,
					render: async () => {
						renders += 1;
						return { bytes: new Uint8Array(), mimeType: "application/octet-stream", outputFormat: "docx" as const };
					},
				}),
			},
		});

		await expect(service.generate({ document: { id: "doc_1", flow: "master", readiness: { ready: false, missing: ["profile.organization_name"] }, masterJson: {} }, documentTypes: ["bukti-1"] })).rejects.toThrow(GenerationValidationError);
		expect(snapshots).toBe(0);
		expect(renders).toBe(0);
	});

	it("returns rendered file metadata for ready documents", async () => {
		const service = new DocumentGeneratorService({
			payloadSnapshots: {
				save: async () => ({ id: "snapshot_1", documentId: "doc_1", flow: "master", documentType: "bukti-1", payload: {}, payloadHash: "hash", schemaVersion: "test", createdAt: new Date() }),
			},
			rendererRegistry: {
				getRenderer: () => ({
					supports: () => true,
					render: async () => ({ bytes: new TextEncoder().encode("docx"), mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", outputFormat: "docx" as const }),
				}),
			},
		});

		const results = await service.generate({ document: { id: "doc_1", flow: "master", readiness: { ready: true, missing: [] }, masterJson: {}, schemaVersion: "test" }, documentTypes: ["bukti-1"] });

		expect(results[0]?.documentType).toBe("bukti-1");
		expect(results[0]?.filename).toBe("bukti-1.docx");
		expect(results[0]?.bytes.length).toBeGreaterThan(0);
	});
});
