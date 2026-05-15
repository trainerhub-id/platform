import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createGenerationRoutes } from "./generation.routes";

class FakeDocumentRepository {
	doc = { id: "doc_1", ownerUserId: "user_1", flow: "master", readiness: { ready: false, missing: ["unit_selection.selected_unit_code"] }, masterJson: {} };
	async findById() {
		return this.doc;
	}
}

class ReadyFakeDocumentRepository extends FakeDocumentRepository {
	doc = { id: "doc_1", ownerUserId: "user_1", flow: "master", readiness: { ready: true, missing: [] }, masterJson: {} };
}

describe("generation routes", () => {
	it("blocks unauthenticated generate request", async () => {
		const app = new Hono<{ Variables: { user: null } }>();
		app.use("*", async (c, next) => {
			c.set("user", null);
			await next();
		});
		app.route("/", createGenerationRoutes({ documents: new FakeDocumentRepository() as any }));

		const res = await app.request("/api/documents/doc_1/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documentTypes: ["bukti-1"] }) });

		expect(res.status).toBe(401);
	});

	it("validates request body", async () => {
		const app = new Hono<{ Variables: { user: { id: string } } }>();
		app.use("*", async (c, next) => {
			c.set("user", { id: "user_1" });
			await next();
		});
		app.route("/", createGenerationRoutes({ documents: new FakeDocumentRepository() as any }));

		const res = await app.request("/api/documents/doc_1/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documentTypes: [] }) });
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error.code).toBe("VALIDATION_ERROR");
	});

	it("blocks unauthenticated generated files list", async () => {
		const app = new Hono<{ Variables: { user: null } }>();
		app.use("*", async (c, next) => {
			c.set("user", null);
			await next();
		});
		app.route("/", createGenerationRoutes({ documents: new FakeDocumentRepository() as any }));

		const res = await app.request("/api/documents/doc_1/files");

		expect(res.status).toBe(401);
	});

	it("redirects generated file downloads to an object storage signed URL", async () => {
		const app = new Hono<{ Variables: { user: { id: string } } }>();
		app.use("*", async (c, next) => {
			c.set("user", { id: "user_1" });
			await next();
		});
		app.route("/", createGenerationRoutes({
			documents: new FakeDocumentRepository() as any,
			generatedFiles: {
				findById: async () => ({ id: "file_1", documentId: "doc_1", filePath: "generated/doc_1/job_1/123.docx", filename: "bukti-1.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
				listByDocument: async () => [],
			} as any,
			objectStorage: {
				getSignedUrl: async (key: string) => `https://storage.example/${key}?signed=1`,
			} as any,
		}));

		const res = await app.request("/api/documents/doc_1/files/file_1/download");

		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toBe("https://storage.example/generated/doc_1/job_1/123.docx?signed=1");
	});

	it("does not enqueue when document is not ready", async () => {
		let enqueued = 0;
		const app = new Hono<{ Variables: { user: { id: string } } }>();
		app.use("*", async (c, next) => {
			c.set("user", { id: "user_1" });
			await next();
		});
		app.route("/", createGenerationRoutes({
			documents: new FakeDocumentRepository() as any,
			generationJobs: { enqueueGeneration: async () => { enqueued += 1; return { id: "job_1" }; } } as any,
		}));

		const res = await app.request("/api/documents/doc_1/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documentTypes: ["bukti-1"] }) });
		const body = await res.json();

		expect(res.status).toBe(409);
		expect(body.error.code).toBe("DOCUMENT_NOT_READY");
		expect(enqueued).toBe(0);
	});

	it("enqueues a single document generation route", async () => {
		const app = new Hono<{ Variables: { user: { id: string } } }>();
		app.use("*", async (c, next) => {
			c.set("user", { id: "user_1" });
			await next();
		});
		app.route("/", createGenerationRoutes({
			documents: new ReadyFakeDocumentRepository() as any,
			generationJobs: { enqueueGeneration: async (input: any) => ({ id: "job_1", input }) } as any,
		}));

		const res = await app.request("/api/documents/doc_1/generate/bukti-1", { method: "POST" });
		const body = await res.json();

		expect(res.status).toBe(202);
		expect(body.job.input.documentTypes).toEqual(["bukti-1"]);
	});

	it("returns a generation job by id", async () => {
		const app = new Hono<{ Variables: { user: { id: string } } }>();
		app.use("*", async (c, next) => {
			c.set("user", { id: "user_1" });
			await next();
		});
		app.route("/", createGenerationRoutes({
			documents: new ReadyFakeDocumentRepository() as any,
			generationJobs: { findById: async () => ({ id: "job_1", documentId: "doc_1", status: "queued" }) } as any,
		}));

		const res = await app.request("/api/generation-jobs/job_1");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.job.id).toBe("job_1");
	});

	it("retries a generation job by id", async () => {
		const app = new Hono<{ Variables: { user: { id: string } } }>();
		app.use("*", async (c, next) => {
			c.set("user", { id: "user_1" });
			await next();
		});
		app.route("/", createGenerationRoutes({
			documents: new ReadyFakeDocumentRepository() as any,
			generationJobs: { retry: async () => ({ id: "job_1", status: "queued" }) } as any,
		}));

		const res = await app.request("/api/generation-jobs/job_1/retry", { method: "POST" });
		const body = await res.json();

		expect(res.status).toBe(202);
		expect(body.job.status).toBe("queued");
	});
});
