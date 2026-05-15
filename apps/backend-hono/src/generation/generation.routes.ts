import { Hono, type Context } from "hono";
import { z } from "zod";
import { requireAuth, type AuthVariables } from "../auth/auth.middleware";
import { errorResponse } from "../common/errors";
import { DocumentRepository, isDocumentOwner } from "../documents/document.repository";
import { ObjectStorageService } from "../storage/object-storage.service";
import { GeneratedFileRepository } from "./generated-file.repository";
import { GenerationJobService, type GenerationJobType } from "./generation-job.service";

const generateRequestSchema = z.object({
	documentTypes: z.array(z.string().min(1)).min(1),
	requestKey: z.string().min(1).max(200).optional(),
});

type GenerationVariables = AuthVariables & { requestId: string };

type GenerationRoutesDeps = {
	documents?: Pick<DocumentRepository, "findById">;
	generationJobs?: Pick<GenerationJobService, "enqueueGeneration" | "listByDocument" | "findById" | "retry">;
	generatedFiles?: Pick<GeneratedFileRepository, "listByDocument" | "findById">;
	objectStorage?: Pick<ObjectStorageService, "getSignedUrl">;
};

function readinessReady(value: unknown): boolean {
	return !!value && typeof value === "object" && (value as { ready?: unknown }).ready === true;
}

export function createGenerationRoutes(deps: GenerationRoutesDeps = {}) {
	const app = new Hono<{ Variables: GenerationVariables }>();
	const documents = deps.documents ?? new DocumentRepository();
	const generationJobs = deps.generationJobs ?? new GenerationJobService();
	const generatedFiles = deps.generatedFiles ?? new GeneratedFileRepository();
	const objectStorage = deps.objectStorage ?? new ObjectStorageService();

	async function requireOwnedDocument(c: Context<{ Variables: GenerationVariables }>) {
		const user = c.get("user");
		if (!user) return { error: errorResponse(c, 401, "UNAUTHORIZED", "Authentication required") };
		const doc = await documents.findById(c.req.param("documentId"));
		if (!doc) return { error: errorResponse(c, 404, "DOCUMENT_NOT_FOUND", "Document not found") };
		if (!isDocumentOwner(doc, user.id)) return { error: errorResponse(c, 403, "FORBIDDEN", "Document belongs to another user") };
		return { doc };
	}

	async function enqueueForDocument(
		c: Context<{ Variables: GenerationVariables }>,
		doc: { id: string; flow: string; readiness: unknown },
		documentTypes: string[],
		requestKey?: string,
	) {
		if (!readinessReady(doc.readiness)) {
			const missing = typeof doc.readiness === "object" && doc.readiness ? (doc.readiness as { missing?: unknown }).missing : undefined;
			return c.json({ error: { code: "DOCUMENT_NOT_READY", message: "Document is not ready for generation", missing } }, 409);
		}

		const jobType: GenerationJobType = doc.flow === "trainer" ? "generate-trainer-documents" : "generate-master-documents";
		const job = await generationJobs.enqueueGeneration({
			documentId: doc.id,
			jobType,
			documentTypes,
			...(requestKey ? { requestKey } : {}),
		});

		return c.json({ job }, 202);
	}

	app.post("/api/documents/:documentId/generate", requireAuth, async (c) => {
		const parsed = generateRequestSchema.safeParse(await c.req.json());
		if (!parsed.success) {
			return errorResponse(c, 400, "VALIDATION_ERROR", parsed.error.issues.map((issue) => issue.message).join("; "));
		}

		const owned = await requireOwnedDocument(c);
		if ("error" in owned) return owned.error;
		return enqueueForDocument(c, owned.doc, parsed.data.documentTypes, parsed.data.requestKey);
	});

	app.post("/api/documents/:documentId/generate/:documentType", requireAuth, async (c) => {
		const owned = await requireOwnedDocument(c);
		if ("error" in owned) return owned.error;
		return enqueueForDocument(c, owned.doc, [c.req.param("documentType")]);
	});

	app.get("/api/documents/:documentId/generation-jobs", requireAuth, async (c) => {
		const owned = await requireOwnedDocument(c);
		if ("error" in owned) return owned.error;
		const jobs = await generationJobs.listByDocument(owned.doc.id);
		return c.json({ jobs });
	});

	app.get("/api/generation-jobs/:jobId", requireAuth, async (c) => {
		const job = await generationJobs.findById(c.req.param("jobId"));
		if (!job) return errorResponse(c, 404, "GENERATION_JOB_NOT_FOUND", "Generation job not found");
		return c.json({ job });
	});

	app.post("/api/generation-jobs/:jobId/retry", requireAuth, async (c) => {
		const job = await generationJobs.retry(c.req.param("jobId"));
		if (!job) return errorResponse(c, 404, "GENERATION_JOB_NOT_FOUND", "Generation job not found");
		return c.json({ job }, 202);
	});

	app.get("/api/documents/:documentId/files", requireAuth, async (c) => {
		const owned = await requireOwnedDocument(c);
		if ("error" in owned) return owned.error;
		const files = await generatedFiles.listByDocument(owned.doc.id);
		return c.json({ files });
	});

	app.get("/api/documents/:documentId/files/:fileId/download", requireAuth, async (c) => {
		const owned = await requireOwnedDocument(c);
		if ("error" in owned) return owned.error;
		const file = await generatedFiles.findById(c.req.param("fileId"), owned.doc.id);
		if (!file) return errorResponse(c, 404, "FILE_NOT_FOUND", "Generated file not found");

		const signedUrl = await objectStorage.getSignedUrl(file.filePath);
		return c.redirect(signedUrl, 302);
	});

	return app;
}
