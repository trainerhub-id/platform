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

	it("gets batch workspace from repository", async () => {
		const service = new BatchService({
			repository: {
				getWorkspace: async (batchId: string) => ({
					id: batchId,
					namaBatch: "Batch Q1",
					trainerName: "Trainer A",
					courseName: "Course A",
					totalEnrollments: 3,
					paidEnrollments: 1,
					pendingPayments: 2,
				}),
			} as any,
		});

		await expect(service.getWorkspace("batch_1")).resolves.toEqual({
			id: "batch_1",
			namaBatch: "Batch Q1",
			trainerName: "Trainer A",
			courseName: "Course A",
			totalEnrollments: 3,
			paidEnrollments: 1,
			pendingPayments: 2,
		});
	});

	it("publishes a draft batch when active tiers are priced and synced", async () => {
		const service = new BatchService({
			repository: {
				findById: async () => ({ id: "batch_1", status: "draft" }),
				getActiveTiersForPublish: async () => [{ id: "tier_1", price: 100000, scalevSyncStatus: "synced" }],
				update: async (id: string, input: Record<string, unknown>) => ({ id, status: input.status }),
			} as any,
		});

		await expect(service.publish("batch_1")).resolves.toEqual({ id: "batch_1", status: "open" });
	});

	it("blocks publish when batch does not exist", async () => {
		const service = new BatchService({
			repository: {
				findById: async () => null,
			} as any,
		});

		await expect(service.publish("batch_1")).rejects.toThrow("BATCH_NOT_FOUND");
	});

	it("blocks publish when batch is not draft", async () => {
		const service = new BatchService({
			repository: {
				findById: async () => ({ id: "batch_1", status: "open" }),
			} as any,
		});

		await expect(service.publish("batch_1")).rejects.toThrow("BATCH_NOT_DRAFT");
	});

	it("blocks publish when there are no active tiers", async () => {
		const service = new BatchService({
			repository: {
				findById: async () => ({ id: "batch_1", status: "draft" }),
				getActiveTiersForPublish: async () => [],
			} as any,
		});

		await expect(service.publish("batch_1")).rejects.toThrow("BATCH_REQUIRES_ACTIVE_TIER");
	});

	it("blocks publish when an active tier has no positive price", async () => {
		const service = new BatchService({
			repository: {
				findById: async () => ({ id: "batch_1", status: "draft" }),
				getActiveTiersForPublish: async () => [{ id: "tier_1", price: 0, scalevSyncStatus: "synced" }],
			} as any,
		});

		await expect(service.publish("batch_1")).rejects.toThrow("BATCH_TIER_PRICE_REQUIRED");
	});

	it("blocks publish when active tiers are not synced", async () => {
		const service = new BatchService({
			repository: {
				findById: async () => ({ id: "batch_1", status: "draft" }),
				getActiveTiersForPublish: async () => [{ id: "tier_1", price: 100000, scalevSyncStatus: "not_synced" }],
			} as any,
		});

		await expect(service.publish("batch_1")).rejects.toThrow("BATCH_TIERS_NOT_SYNCED");
	});
});
