import { describe, expect, it } from "vitest";
import { BatchService, createBatchSlug } from "./batch.service";

describe("BatchService", () => {
	it("creates slug from batch name", () => {
		expect(createBatchSlug("Batch Training Q1 2026!!")).toBe("batch-training-q1-2026");
	});

	it("creates batch through repository", async () => {
		const service = new BatchService({ repository: { create: async (input: unknown) => ({ id: "batch_1", ...(input as object) }) } as any });

		const batch = await service.create({ namaBatch: "Batch Q1", tanggal: "2026-05-01T00:00:00.000Z" });

		expect(batch.slug).toBe("batch-q1");
	});

	it("resolves map URL with fallback", async () => {
		const service = new BatchService({ fetcher: async () => ({ url: "https://maps.google.com/final" }) as Response });

		expect(await service.resolveMapUrl("https://maps.app.goo.gl/x")).toEqual({ finalUrl: "https://maps.google.com/final" });
	});
});
