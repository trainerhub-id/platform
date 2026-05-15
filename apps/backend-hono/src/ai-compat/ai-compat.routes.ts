import { Hono, type Context } from "hono";
import { AiModelNotConfiguredError } from "../ai/model.service";
import { requireAuth, type AuthVariables } from "../auth/auth.middleware";
import { errorResponse } from "../common/errors";
import { DocumentRepository, isDocumentOwner, type DocumentFlow } from "../documents/document.repository";
import { GeneratedFileRepository } from "../generation/generated-file.repository";
import { GenerationJobService, type GenerationJobType } from "../generation/generation-job.service";
import { InterviewEngine } from "../interview/interview-engine";
import { ObjectStorageService } from "../storage/object-storage.service";

type AiCompatVariables = AuthVariables & { requestId: string };
type UserLike = NonNullable<AuthVariables["user"]>;
type DocumentRecord = NonNullable<Awaited<ReturnType<DocumentRepository["create"]>>>;
type GenerationJobRecord = { id: string; status?: string | null; createdAt?: Date | string | null; updatedAt?: Date | string | null; error?: unknown; input?: unknown };
type GeneratedFileRecord = Awaited<ReturnType<GeneratedFileRepository["listByDocument"]>>[number];

type AiCompatDeps = {
  documents?: Pick<DocumentRepository, "create" | "listByOwner" | "findById" | "updateTitle" | "softDelete" | "updateInterviewState">;
  generationJobs?: Pick<GenerationJobService, "enqueueGeneration" | "listByDocument" | "retry">;
  generatedFiles?: Pick<GeneratedFileRepository, "listByDocument" | "findById">;
  objectStorage?: Pick<ObjectStorageService, "getSignedUrl">;
  interviewEngine?: Pick<InterviewEngine, "handleMessage">;
};

const agents = [
  { type: "master", id: "master", name: "AI for Master", description: "Susun dokumen master sertifikasi berbasis data training.", category: "sertifikasi" },
  { type: "trainer", id: "trainer", name: "AI for Trainer", description: "Siapkan dokumen trainer dan materi pelatihan.", category: "training" },
];

const trailerCategories = new Set(["trainer", "master", "branding"]);

function getUser(c: Context<{ Variables: AiCompatVariables }>): UserLike {
  const user = c.get("user");
  if (!user) throw new Error("Authenticated route reached without user context");
  return user;
}

function inferFlow(input: unknown): DocumentFlow {
  if (input && typeof input === "object" && "flow" in input) {
    const flow = (input as { flow?: unknown }).flow;
    if (flow === "master" || flow === "trainer") return flow;
  }
  const name = input && typeof input === "object" && typeof (input as { name?: unknown }).name === "string" ? (input as { name: string }).name : "";
  return name.toLowerCase().includes("master") ? "master" : "trainer";
}

function titleFromBody(input: unknown, flow: DocumentFlow): string {
  if (input && typeof input === "object") {
    const body = input as { name?: unknown; title?: unknown };
    if (typeof body.name === "string" && body.name.trim()) return body.name.trim();
    if (typeof body.title === "string" && body.title.trim()) return body.title.trim();
  }
  return flow === "master" ? "Master Document" : "Trainer Document";
}

function progressFromReadiness(readiness: unknown): Record<string, string> {
  if (!readiness || typeof readiness !== "object") return {};
  const missing = Array.isArray((readiness as { missing?: unknown }).missing) ? (readiness as { missing: string[] }).missing : [];
  return Object.fromEntries(missing.map((key) => [key, "missing"]));
}

function compactDocument(doc: DocumentRecord) {
  return {
    id: doc.id,
    documentId: doc.id,
    name: doc.title,
    title: doc.title,
    flow: doc.flow,
    state: doc.status === "ready" ? "ready" : doc.status === "draft" ? "draft" : "in_progress",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function assertDocument(doc: DocumentRecord | undefined): DocumentRecord {
  if (!doc) throw new Error("DOCUMENT_CREATE_FAILED");
  return doc;
}

function buildProgressPayload(doc: DocumentRecord) {
  const missing = doc.readiness && typeof doc.readiness === "object" && Array.isArray((doc.readiness as { missing?: unknown }).missing)
    ? (doc.readiness as { missing: string[] }).missing
    : [];

  return {
    documentId: doc.id,
    progress: progressFromReadiness(doc.readiness),
    phase: doc.currentPhase,
    masterJson: doc.masterJson,
    readiness: doc.readiness,
    generationReady: !!(doc.readiness && typeof doc.readiness === "object" && (doc.readiness as { ready?: unknown }).ready),
    missingFields: missing,
    miniMasterData: doc.masterJson,
    state: doc.status === "ready" ? "ready" : doc.status === "draft" ? "draft" : "in_progress",
  };
}

function documentTypeFromJob(job: GenerationJobRecord): string {
  const input = job.input;
  if (!input || typeof input !== "object") return "document";
  const types = (input as { documentTypes?: unknown }).documentTypes;
  return Array.isArray(types) && typeof types[0] === "string" ? types[0] : "document";
}

function normalizeJobStatus(status: unknown): "pending" | "processing" | "success" | "failed" {
  if (status === "completed" || status === "success") return "success";
  if (status === "failed") return "failed";
  if (status === "queued" || status === "pending") return "pending";
  return "processing";
}

function mapJobLog(documentId: string, job: GenerationJobRecord) {
  const status = normalizeJobStatus(job.status);
  const createdAt = job.createdAt ?? new Date().toISOString();
  return {
    id: job.id,
    aiDocumentId: documentId,
    documentType: documentTypeFromJob(job),
    status,
    progressPercent: status === "success" ? 100 : status === "failed" ? 0 : 10,
    errorMessage: typeof job.error === "string" ? job.error : null,
    retryCount: 0,
    startedAt: createdAt,
    completedAt: status === "success" || status === "failed" ? job.updatedAt ?? createdAt : null,
    createdAt,
  };
}

function mapFileLog(documentId: string, file: GeneratedFileRecord) {
  return {
    id: file.id,
    aiDocumentId: documentId,
    documentType: file.documentType,
    status: "success" as const,
    progressPercent: 100,
    errorMessage: null,
    retryCount: 0,
    startedAt: file.createdAt,
    completedAt: file.createdAt,
    createdAt: file.createdAt,
    filename: file.filename,
    filePath: file.filePath,
  };
}

function eventStream(events: Array<{ type: string; payload?: unknown }>) {
  const body = events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("") + "data: [DONE]\n\n";
  return new Response(body, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache",
    },
  });
}

export function createAiCompatRoutes(deps: AiCompatDeps = {}) {
  const app = new Hono<{ Variables: AiCompatVariables }>();
  const documents = deps.documents ?? new DocumentRepository();
  const generationJobs = deps.generationJobs ?? new GenerationJobService();
  const generatedFiles = deps.generatedFiles ?? new GeneratedFileRepository();
  const objectStorage = deps.objectStorage ?? new ObjectStorageService();
  const interviewEngine = deps.interviewEngine ?? new InterviewEngine();

	  async function loadOwnedDocument(c: Context<{ Variables: AiCompatVariables }>) {
	    const user = getUser(c);
	    const documentId = c.req.param("documentId") || c.req.param("aiDocumentId");
	    if (!documentId) return { error: errorResponse(c, 400, "VALIDATION_ERROR", "documentId is required") };
	    const doc = await documents.findById(documentId);
    if (!doc) return { error: errorResponse(c, 404, "DOCUMENT_NOT_FOUND", "Document not found") };
    if (!isDocumentOwner(doc, user.id)) return { error: errorResponse(c, 403, "FORBIDDEN", "Document belongs to another user") };
    return { doc };
  }

  async function enqueueGeneration(c: Context<{ Variables: AiCompatVariables }>, doc: DocumentRecord, documentTypes: string[]) {
    if (!doc.readiness || typeof doc.readiness !== "object" || (doc.readiness as { ready?: unknown }).ready !== true) {
      return c.json({
        logId: "",
        status: "failed",
        documentType: documentTypes[0] ?? "document",
        success: false,
        validationError: {
          canGenerate: false,
          documentName: doc.title,
          summaryMessage: "Data dokumen belum lengkap untuk generate.",
          missingData: ((doc.readiness as { missing?: unknown })?.missing as string[] | undefined ?? []).map((field) => ({
            section: field,
            sectionName: field,
            friendlyMessage: `${field} belum lengkap`,
            aiMentorUrl: `/user/ai-generator`,
          })),
        },
      });
    }

    const jobType: GenerationJobType = doc.flow === "trainer" ? "generate-trainer-documents" : "generate-master-documents";
    const job = await generationJobs.enqueueGeneration({ documentId: doc.id, jobType, documentTypes });
    return c.json({
      logId: job.id,
      status: "processing",
      documentType: documentTypes[0] ?? "document",
      success: true,
      progressPercent: 10,
    });
  }

  app.get("/ai/documents/agents", requireAuth, (c) => c.json(agents));
  app.get("/ai/agents", requireAuth, (c) => c.json(agents));

  app.get("/ai-trailer/:category", requireAuth, (c) => {
    const category = c.req.param("category");
    if (!trailerCategories.has(category)) return errorResponse(c, 404, "TRAILER_NOT_FOUND", "AI trailer not found");
    return c.json({
      category,
      title: category === "master" ? "AI for Master" : category === "trainer" ? "AI for Trainer" : "AI for Branding",
      description: "",
      muxPlaybackId: null,
      playbackToken: null,
      thumbnailUrl: null,
      buyUrl: null,
      upgradeUrl: null,
      isActive: false,
    });
  });

  app.get("/admin/ai-trailer", requireAuth, (c) => c.json(
    Object.fromEntries([...trailerCategories].map((category) => [
      category,
      {
        category,
        title: category === "master" ? "AI for Master" : category === "trainer" ? "AI for Trainer" : "AI for Branding",
        description: "",
        muxPlaybackId: null,
        playbackToken: null,
        thumbnailUrl: null,
        buyUrl: null,
        upgradeUrl: null,
        isActive: false,
      },
    ])),
  ));

  app.put("/admin/ai-trailer/:category", requireAuth, async (c) => {
    const category = c.req.param("category");
    if (!trailerCategories.has(category)) return errorResponse(c, 404, "TRAILER_NOT_FOUND", "AI trailer not found");
    const body = await c.req.json().catch(() => ({}));
    return c.json({ ...body, category, isActive: false });
  });

  app.post("/admin/ai-trailer/:category/mux-upload", requireAuth, (c) => {
    const category = c.req.param("category");
    if (!trailerCategories.has(category)) return errorResponse(c, 404, "TRAILER_NOT_FOUND", "AI trailer not found");
    return errorResponse(c, 501, "TRAILER_UPLOAD_NOT_IMPLEMENTED", "Trailer upload is not available in Hono yet");
  });

  app.get("/admin/ai-trailer/:category/mux-status", requireAuth, (c) => {
    const category = c.req.param("category");
    if (!trailerCategories.has(category)) return errorResponse(c, 404, "TRAILER_NOT_FOUND", "AI trailer not found");
    return c.json({ category, status: "not_configured", isReady: false });
  });

  app.delete("/admin/ai-trailer/:category/mux-asset", requireAuth, (c) => {
    const category = c.req.param("category");
    if (!trailerCategories.has(category)) return errorResponse(c, 404, "TRAILER_NOT_FOUND", "AI trailer not found");
    return c.json({ success: true });
  });

  app.post("/ai/document/create", requireAuth, async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const flow = inferFlow(body);
    const doc = assertDocument(await documents.create({ ownerUserId: getUser(c).id, flow, title: titleFromBody(body, flow) }));
    return c.json({ ...compactDocument(doc), progress: progressFromReadiness(doc.readiness), isNew: true });
  });

  app.get("/ai/document/list", requireAuth, async (c) => {
    const docs = await documents.listByOwner(getUser(c).id);
    return c.json(docs.map(compactDocument));
  });

  app.get("/ai/document/latest", requireAuth, async (c) => {
    const user = getUser(c);
    const [latest] = await documents.listByOwner(user.id);
    const doc = latest ?? assertDocument(await documents.create({ ownerUserId: user.id, flow: "trainer", title: "Trainer Document" }));
    return c.json({ documentId: doc.id, progress: progressFromReadiness(doc.readiness), state: compactDocument(doc).state, isNew: !latest });
  });

  app.get("/ai/document/progress/:documentId", requireAuth, async (c) => {
    const loaded = await loadOwnedDocument(c);
    if ("error" in loaded) return loaded.error;
    return c.json(buildProgressPayload(loaded.doc));
  });

  app.post("/ai/document/:documentId/rename", requireAuth, async (c) => {
    const loaded = await loadOwnedDocument(c);
    if ("error" in loaded) return loaded.error;
    const body = await c.req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return errorResponse(c, 400, "VALIDATION_ERROR", "name is required");
    const updated = await documents.updateTitle(loaded.doc.id, name);
    return c.json({ document: updated ? compactDocument(updated) : compactDocument(loaded.doc) });
  });

  app.post("/ai/document/:documentId/delete", requireAuth, async (c) => {
    const loaded = await loadOwnedDocument(c);
    if ("error" in loaded) return loaded.error;
    await documents.softDelete(loaded.doc.id);
    return c.json({ success: true });
  });

  app.post("/ai/document/:documentId/fields", requireAuth, async (c) => {
    const loaded = await loadOwnedDocument(c);
    if ("error" in loaded) return loaded.error;
    const body = await c.req.json().catch(() => ({}));
    const fields = body && typeof body === "object" && "fields" in body ? (body as { fields: unknown }).fields : {};
    const masterJson = { ...(loaded.doc.masterJson as Record<string, unknown>), fields };
    const updated = await documents.updateInterviewState(loaded.doc.id, {
      masterJson,
      readiness: loaded.doc.readiness,
      currentPhase: loaded.doc.currentPhase,
      status: loaded.doc.status,
    });
    return c.json({ success: true, document: updated ? compactDocument(updated) : compactDocument(loaded.doc) });
  });

  app.post("/ai/document/:documentId/clear-section", requireAuth, async (c) => c.json({ success: true }));
  app.post("/ai/document/:documentId/clear-sections", requireAuth, async (c) => c.json({ success: true }));

  app.get("/ai/document/:documentId/chat-transcript", requireAuth, async (c) => {
    const loaded = await loadOwnedDocument(c);
    if ("error" in loaded) return loaded.error;
    return c.json({ turns: [] });
  });

  app.get("/ai/document/:documentId/validation", requireAuth, async (c) => {
    const loaded = await loadOwnedDocument(c);
    if ("error" in loaded) return loaded.error;
    const progress = buildProgressPayload(loaded.doc);
    return c.json({
      canGenerate: progress.generationReady,
      missingFields: progress.missingFields,
      documents: [],
      masterJson: progress.masterJson,
    });
  });

  app.post("/ai/documents/interview-questions/:documentType", requireAuth, (c) => c.json({
    questions: [
      { id: "topic", type: "text", question: "Topik training", required: true },
      { id: "audience", type: "text", question: "Target peserta", required: true },
      { id: "objective", type: "textarea", question: "Tujuan training", required: true },
    ],
    metadata: { type: c.req.param("documentType"), name: c.req.param("documentType") },
  }));

  app.post("/ai/documents/validate/:documentType", requireAuth, (c) => c.json({ isValid: true, errors: [] }));

  app.post("/ai/documents/generate/:documentType", requireAuth, async (c) => {
    const documentType = c.req.param("documentType");
    return c.json({
      success: true,
      generatedAt: new Date().toISOString(),
      agentType: documentType,
      document: {
        title: documentType,
        sections: [{ id: "summary", title: "Ringkasan", content: "Data berhasil diterima oleh backend Hono.", order: 1 }],
        metadata: { title: documentType, documentType, createdAt: new Date().toISOString() },
      },
    });
  });

  app.post("/ai/documents/export/preview", requireAuth, async (c) => c.json({ html: "<article><p>Preview dokumen tersedia.</p></article>" }));
  app.post("/ai/documents/export/:format", requireAuth, async (c) => c.body("Generated document export is queued in Hono.", 200, { "content-type": "text/plain" }));

  app.get("/ai/ai-document/:aiDocumentId/logs", requireAuth, async (c) => {
    const loaded = await loadOwnedDocument(c);
    if ("error" in loaded) return loaded.error;
    const [jobs, files] = await Promise.all([
      generationJobs.listByDocument(loaded.doc.id),
      generatedFiles.listByDocument(loaded.doc.id),
    ]);
    return c.json([...files.map((file) => mapFileLog(loaded.doc.id, file)), ...jobs.map((job) => mapJobLog(loaded.doc.id, job as GenerationJobRecord))]);
  });

  app.post("/ai/ai-document/:aiDocumentId/generate", requireAuth, async (c) => {
    const loaded = await loadOwnedDocument(c);
    if ("error" in loaded) return loaded.error;
    const body = await c.req.json().catch(() => ({}));
    const documentType = typeof body.documentType === "string" ? body.documentType : "document";
    return enqueueGeneration(c, loaded.doc, [documentType]);
  });

  app.post("/ai/ai-document/:aiDocumentId/generate-batch", requireAuth, async (c) => {
    const loaded = await loadOwnedDocument(c);
    if ("error" in loaded) return loaded.error;
    const body = await c.req.json().catch(() => ({}));
    const documentTypes = body && typeof body === "object" && Array.isArray((body as { documentTypes?: unknown }).documentTypes)
      ? (body as { documentTypes: unknown[] }).documentTypes.filter((value: unknown): value is string => typeof value === "string")
      : [];
    if (documentTypes.length === 0) return errorResponse(c, 400, "VALIDATION_ERROR", "documentTypes is required");
    const response = await enqueueGeneration(c, loaded.doc, documentTypes);
    const data = await response.clone().json();
    const failed = data.status === "failed" ? documentTypes.length : 0;
    return c.json({
      success: failed === 0,
      totalRequested: documentTypes.length,
      totalSuccess: failed === 0 ? documentTypes.length : 0,
      totalFailed: failed,
      results: documentTypes.map((documentType) => ({ ...data, documentType })),
    });
  });

  app.post("/ai/ai-document/:aiDocumentId/retry/:logId", requireAuth, async (c) => {
    const loaded = await loadOwnedDocument(c);
    if ("error" in loaded) return loaded.error;
    const job = await generationJobs.retry(c.req.param("logId"));
    if (!job) return errorResponse(c, 404, "GENERATION_JOB_NOT_FOUND", "Generation job not found");
    return c.json({ logId: job.id, status: "processing", documentType: documentTypeFromJob(job as GenerationJobRecord), success: true });
  });

  app.get("/ai/ai-document/:aiDocumentId/download/:logId", requireAuth, async (c) => {
    const loaded = await loadOwnedDocument(c);
    if ("error" in loaded) return loaded.error;
    const file = await generatedFiles.findById(c.req.param("logId"), loaded.doc.id);
    if (!file) return errorResponse(c, 404, "FILE_NOT_FOUND", "Generated file not found");
    return c.redirect(await objectStorage.getSignedUrl(file.filePath), 302);
  });

  app.get("/ai/ai-document/:aiDocumentId/download-all", requireAuth, async (c) => c.body("Generated files are available individually.", 200, { "content-type": "text/plain" }));

  app.post("/ai/document/:documentId/generate-all-sections", requireAuth, async (c) => eventStream([
    { type: "progress", payload: { progress: 100, section: "compatibility" } },
    { type: "result", payload: { success: true, completedSections: [], failedSections: [], totalTime: 0 } },
  ]));

  app.get("/ai/chat/sessions", requireAuth, (c) => c.json([]));
  app.post("/ai/chat/sessions", requireAuth, async (c) => c.json({ id: crypto.randomUUID(), agentType: (await c.req.json().catch(() => ({}))).agentType ?? "trainer", createdAt: new Date().toISOString() }, 201));
  app.get("/ai/chat/sessions/:sessionId", requireAuth, (c) => c.json({ session: { id: c.req.param("sessionId"), createdAt: new Date().toISOString() }, messages: [] }));
  app.post("/ai/chat/sessions/:sessionId/messages", requireAuth, (c) => c.json({ success: true }));
  app.delete("/ai/chat/sessions/:sessionId", requireAuth, (c) => c.json({ success: true }));

  app.post("/ai/chat", requireAuth, async (c) => {
    const user = getUser(c);
    const body = await c.req.json().catch(() => ({}));
    const documentId = typeof body.documentId === "string" ? body.documentId : "";
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const lastUserMessage = [...messages].reverse().find((message) => message && typeof message === "object" && (message as { role?: unknown }).role === "user") as { content?: unknown } | undefined;
    const message = typeof lastUserMessage?.content === "string" ? lastUserMessage.content : "";

    if (!documentId || !message) {
      return eventStream([{ type: "text-delta", payload: { text: "Kirim pesan dan pilih dokumen agar AI bisa memproses data." } }]);
    }

    const response = await interviewEngine.handleMessage({ documentId, userId: user.id, message }).catch((error) => {
      if (error instanceof AiModelNotConfiguredError) {
        return errorResponse(c, 503, "AI_MODEL_NOT_CONFIGURED", "Layanan AI belum dikonfigurasi di server.");
      }
      throw error;
    });
    if (!response.ok) return response;
    const text = await response.text();
    return eventStream([{ type: "text-delta", payload: { text } }]);
  });

  return app;
}
