import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createBatchRoutes } from "./batch.routes";

describe("batch routes", () => {
	it("lists batches for admin", async () => {
		const app = new Hono<{ Variables: { user: { id: string; role: string } } }>();
		app.use("*", async (c, next) => {
			c.set("user", { id: "admin_1", role: "admin" });
			await next();
		});
		app.route("/", createBatchRoutes({ listForUser: async () => [{ id: "batch_1" }] } as any));

		const res = await app.request("/batch/list");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.batches[0].id).toBe("batch_1");
	});

	it("creates batch for admin", async () => {
		const app = new Hono<{ Variables: { user: { id: string; role: string } } }>();
		app.use("*", async (c, next) => {
			c.set("user", { id: "admin_1", role: "admin" });
			await next();
		});
		app.route("/", createBatchRoutes({ create: async () => ({ id: "batch_1" }) } as any));

		const res = await app.request("/batch/create", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ namaBatch: "Batch Q1", tanggal: "2026-05-01T00:00:00.000Z" }) });
		const body = await res.json();

		expect(res.status).toBe(201);
		expect(body.batch.id).toBe("batch_1");
	});
});
