import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { createPaymentRoutes } from "./payment.routes";

describe("payment routes", () => {
	it("returns public batch tiers", async () => {
		const app = createPaymentRoutes({ getPublicBatchInfo: async () => ({ batch: { id: "batch_1" }, tiers: [] }) } as any);

		const res = await app.request("/public/batches/batch-q1/tiers");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.batch.id).toBe("batch_1");
	});

	it("checks duplicates", async () => {
		const app = createPaymentRoutes({ checkDuplicate: async () => ({ isDuplicate: false }) } as any);

		const res = await app.request("/public/register/check-duplicate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "budi@example.com", batchSlug: "batch-q1" }) });
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.isDuplicate).toBe(false);
	});

	it("creates public registrations", async () => {
		const app = createPaymentRoutes({
			createRegistration: async (input: any) => ({ sessionId: "session_1", email: input.email }),
		} as any);

		const res = await app.request("/public/register", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ email: "budi@example.com", whatsapp: "081234567890", batchSlug: "batch-q1", tierSlug: "vip", paymentMethod: "qris" }),
		});
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.sessionId).toBe("session_1");
		expect(body.email).toBe("budi@example.com");
	});

	it("claims paid sessions", async () => {
		const app = createPaymentRoutes({
			claimPayment: async (sessionId: string, token?: string) => ({ signInToken: "sign_in_1", sessionId, token }),
		} as any);

		const res = await app.request("/public/payment/claim/session_1?token=token_1");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual({ signInToken: "sign_in_1", sessionId: "session_1", token: "token_1" });
	});

	it("refreshes payment sessions on check", async () => {
		const app = createPaymentRoutes({
			refreshScalevPaymentStatus: async (sessionId: string, token?: string, forceCheck?: boolean) => ({ sessionId, token, forceCheck, status: "paid" }),
		} as any);

		const res = await app.request("/public/payment/session/session_1/check?token=token_1", { method: "POST" });
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual({ sessionId: "session_1", token: "token_1", forceCheck: true, status: "paid" });
	});

	it("creates admin batch tiers behind the admin role guard", async () => {
		const app = new Hono<{ Variables: { user: { id: string; role: string } } }>();
		app.use("*", async (c, next) => {
			c.set("user", { id: "admin_1", role: "admin" });
			await next();
		});
		app.route("/", createPaymentRoutes({
			createTier: async (batchId: string, input: any) => ({ id: "tier_1", batchId, price: input.price }),
		} as any));

		const res = await app.request("/admin/batches/batch_1/tiers", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ name: "VIP", slug: "vip", price: 250000 }),
		});
		const body = await res.json();

		expect(res.status).toBe(201);
		expect(body.tier).toEqual({ id: "tier_1", batchId: "batch_1", price: 250000 });
	});

	it("blocks admin tier routes for non-admin users", async () => {
		const app = new Hono<{ Variables: { user: { id: string; role: string } } }>();
		app.use("*", async (c, next) => {
			c.set("user", { id: "user_1", role: "peserta" });
			await next();
		});
		app.route("/", createPaymentRoutes({ getTiersByBatch: async () => [] } as any));

		const res = await app.request("/admin/batches/batch_1/tiers");
		const body = await res.json();

		expect(res.status).toBe(403);
		expect(body.error.code).toBe("FORBIDDEN");
	});
});
