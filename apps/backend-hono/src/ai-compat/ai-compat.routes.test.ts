import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { AiModelNotConfiguredError } from "../ai/model.service";
import { createAiCompatRoutes } from "./ai-compat.routes";

const now = new Date("2026-01-01T00:00:00.000Z");

function makeDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: "doc_1",
    ownerUserId: "user_1",
    flow: "trainer",
    title: "Trainer Document",
    status: "draft",
    currentPhase: "brainstorming",
    schemaVersion: "hono_trainer_alpha_v1",
    masterJson: { schema_key: "hono_trainer_alpha_v1" },
    readiness: { ready: true, missing: [] },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

function createAuthedApp(deps: Parameters<typeof createAiCompatRoutes>[0] = {}) {
  const app = new Hono<{ Variables: { user: { id: string; email: string; role: string }; session: null; requestId: string } }>();
  app.use("*", async (c, next) => {
    c.set("user", { id: "user_1", email: "user@example.com", role: "peserta" });
    c.set("session", null);
    c.set("requestId", "req_1");
    await next();
  });
  app.route("/api", createAiCompatRoutes(deps));
  return app;
}

describe("AI compatibility routes", () => {
  it("serves legacy agent list under /api/ai", async () => {
    const app = createAuthedApp();
    const res = await app.request("/api/ai/documents/agents");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.map((agent: { type: string }) => agent.type)).toContain("trainer");
  });

  it("serves inactive legacy trailer data instead of 404", async () => {
    const app = createAuthedApp();
    const res = await app.request("/api/ai-trailer/trainer");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.category).toBe("trainer");
    expect(body.isActive).toBe(false);
  });

  it("maps legacy document create and progress routes to Hono documents", async () => {
    const doc = makeDocument();
    const app = createAuthedApp({
      documents: {
        create: async () => doc,
        listByOwner: async () => [doc],
        findById: async () => doc,
        updateTitle: async () => doc,
        softDelete: async () => doc,
        updateInterviewState: async () => doc,
      } as any,
    });

    const created = await app.request("/api/ai/document/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Pelatihan Hono" }),
    });
    const createdBody = await created.json();
    const progress = await app.request(`/api/ai/document/progress/${createdBody.documentId}`);
    const progressBody = await progress.json();

    expect(created.status).toBe(200);
    expect(createdBody.documentId).toBe("doc_1");
    expect(progress.status).toBe(200);
    expect(progressBody.generationReady).toBe(true);
  });

  it("returns validation-style failure for legacy generation when document is not ready", async () => {
    const doc = makeDocument({ readiness: { ready: false, missing: ["training.topic"] } });
    const app = createAuthedApp({
      documents: { findById: async () => doc } as any,
    });

    const res = await app.request("/api/ai/ai-document/doc_1/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentType: "lesson_plan" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("failed");
    expect(body.validationError.missingData[0].section).toBe("training.topic");
  });

  it("enqueues legacy generation for ready documents", async () => {
    const doc = makeDocument();
    const app = createAuthedApp({
      documents: { findById: async () => doc } as any,
      generationJobs: {
        enqueueGeneration: async (input: unknown) => ({ id: "job_1", input, status: "queued" }),
      } as any,
    });

    const res = await app.request("/api/ai/ai-document/doc_1/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentType: "lesson_plan" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.logId).toBe("job_1");
    expect(body.status).toBe("processing");
  });

  it("wraps chat responses in the legacy SSE envelope", async () => {
    const doc = makeDocument();
    const app = createAuthedApp({
      documents: { findById: async () => doc } as any,
      interviewEngine: {
        handleMessage: async () => new Response("Halo dari Hono"),
      },
    });

    const res = await app.request("/api/ai/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId: "doc_1", messages: [{ role: "user", content: "Halo" }] }),
    });
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(text).toContain("text-delta");
    expect(text).toContain("Halo dari Hono");
  });

  it("returns a clear 503 when the AI model is not configured", async () => {
    const app = createAuthedApp({
      interviewEngine: {
        handleMessage: async () => {
          throw new AiModelNotConfiguredError("AI_MODEL_NOT_CONFIGURED: DEEPSEEK_API_KEY is required");
        },
      },
    });

    const res = await app.request("/api/ai/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documentId: "doc_1", messages: [{ role: "user", content: "Halo" }] }),
    });
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error.code).toBe("AI_MODEL_NOT_CONFIGURED");
  });
});
