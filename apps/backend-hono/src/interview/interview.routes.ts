import { Hono } from "hono";
import { z } from "zod";
import { requireAuth, type AuthVariables } from "../auth/auth.middleware";
import { errorResponse } from "../common/errors";
import { DocumentRepository, isDocumentOwner } from "../documents/document.repository";
import { ConversationRepository } from "./conversation.repository";
import { FieldStateRepository } from "./field-state.repository";
import type { FieldStateSnapshot } from "./field-state.types";
import { InterviewEngine } from "./interview-engine";
import { buildMasterReadiness } from "./master/master-readiness";
import { getNextMasterPhase, getNextTrainerPhase } from "./phase-router";
import { buildTrainerReadiness } from "./trainer/trainer-readiness";

const messageSchema = z.object({
	message: z.string().min(1).max(8000),
	clientMessageId: z.string().max(200).optional(),
});

type InterviewRouteVariables = AuthVariables & { requestId: string };

type EngineLike = Pick<InterviewEngine, "handleMessage">;

type ReadRouteDeps = {
	documents?: Pick<DocumentRepository, "findById">;
	fieldStates?: Pick<FieldStateRepository, "list">;
	conversations?: Pick<ConversationRepository, "recentMessages">;
};

async function loadOwnedDocument(c: any, documents: Pick<DocumentRepository, "findById">) {
	const user = c.get("user");
	if (!user) return { error: errorResponse(c, 401, "UNAUTHORIZED", "Authentication required") };
	const doc = await documents.findById(c.req.param("documentId"));
	if (!doc) return { error: errorResponse(c, 404, "DOCUMENT_NOT_FOUND", "Document not found") };
	if (!isDocumentOwner(doc, user.id)) return { error: errorResponse(c, 403, "FORBIDDEN", "Document belongs to another user") };
	return { doc };
}

function buildReadinessForFlow(flow: string, states: FieldStateSnapshot[]) {
	if (flow === "trainer") {
		const readiness = buildTrainerReadiness(states);
		return { ...readiness, phase: getNextTrainerPhase(states) };
	}
	const readiness = buildMasterReadiness(states);
	return { ...readiness, phase: getNextMasterPhase(states) };
}

export function createInterviewReadRoutes(deps: ReadRouteDeps = {}) {
	const app = new Hono<{ Variables: InterviewRouteVariables }>();
	const documents = deps.documents ?? new DocumentRepository();
	const fieldStates = deps.fieldStates ?? new FieldStateRepository();
	const conversations = deps.conversations ?? new ConversationRepository();

	app.get("/api/interview/:documentId/readiness", requireAuth, async (c) => {
		const loaded = await loadOwnedDocument(c, documents);
		if ("error" in loaded) return loaded.error;
		const flow = loaded.doc.flow as "master" | "trainer";
		const states = (await fieldStates.list(loaded.doc.id, flow)) as FieldStateSnapshot[];
		const readiness = buildReadinessForFlow(flow, states);
		return c.json({
			ready: readiness.ready,
			phase: readiness.phase,
			missing: readiness.missing,
			pendingConfirmation: readiness.pendingConfirmation,
			optionalGaps: readiness.optionalGaps,
			fields: states.map((state) => ({
				phaseKey: state.phaseKey,
				fieldKey: state.fieldKey,
				status: state.status,
				value: state.value,
			})),
		});
	});

	app.get("/api/interview/:documentId/messages", requireAuth, async (c) => {
		const loaded = await loadOwnedDocument(c, documents);
		if ("error" in loaded) return loaded.error;
		const messages = await conversations.recentMessages(loaded.doc.id, 100);
		return c.json({ messages: messages.slice().reverse() });
	});

	app.get("/api/interview/:documentId/summary", requireAuth, async (c) => {
		const loaded = await loadOwnedDocument(c, documents);
		if ("error" in loaded) return loaded.error;
		const messages = await conversations.recentMessages(loaded.doc.id, 20);
		const summary = messages
			.slice()
			.reverse()
			.map((message) => `${message.role}: ${message.content}`)
			.join("\n")
			.slice(0, 4000);
		return c.json({ summary });
	});

	return app;
}

export function createInterviewRoutes(engine: EngineLike = new InterviewEngine()) {
	const app = new Hono<{ Variables: InterviewRouteVariables }>();

	app.post("/api/interview/:documentId/message", requireAuth, async (c) => {
		const user = c.get("user");
		if (!user) return errorResponse(c, 401, "UNAUTHORIZED", "Authentication required");

		const parsed = messageSchema.safeParse(await c.req.json());
		if (!parsed.success) {
			return errorResponse(c, 400, "VALIDATION_ERROR", parsed.error.issues.map((issue) => issue.message).join("; "));
		}

		const documentId = c.req.param("documentId");
		const response = await engine.handleMessage({
			documentId,
			userId: user.id,
			message: parsed.data.message,
		});

		response.headers.set("x-document-id", documentId);
		return response;
	});

	return app;
}
