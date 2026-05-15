import { ExtractionService, type ExtractionServiceLike } from "../ai/extraction.service";
import { ResponseService, type ResponseServiceLike } from "../ai/response.service";
import { db } from "../db/client";
import { DocumentRepository, isDocumentOwner } from "../documents/document.repository";
import { ConversationRepository } from "./conversation.repository";
import { FieldStateRepository } from "./field-state.repository";
import type { FieldStateSnapshot } from "./field-state.types";
import { buildGeneratedFieldPatches } from "./generated-fields";
import { buildMasterReadiness } from "./master/master-readiness";
import { compileMasterJson } from "./master/master-json-compiler";
import { getNextMasterPhase, getNextTrainerPhase } from "./phase-router";
import { compileTrainerJson } from "./trainer/trainer-json-compiler";
import { buildTrainerReadiness } from "./trainer/trainer-readiness";

export type InterviewRepositories = {
  documents: Pick<DocumentRepository, "findById" | "updateInterviewState">;
  fieldStates: Pick<FieldStateRepository, "list" | "upsert">;
  conversations: Pick<ConversationRepository, "addMessage" | "recentMessages">;
};

export type TransactionRunner = {
  run<T>(callback: (repositories: InterviewRepositories) => Promise<T>): Promise<T>;
};

export type InterviewEngineDeps = Partial<InterviewRepositories> & {
  extraction?: ExtractionServiceLike;
  response?: ResponseServiceLike;
  transactionRunner?: TransactionRunner;
};

export class InterviewEngine {
  private readonly documents: NonNullable<InterviewEngineDeps["documents"]>;
  private readonly fieldStates: NonNullable<InterviewEngineDeps["fieldStates"]>;
  private readonly conversations: NonNullable<InterviewEngineDeps["conversations"]>;
  private readonly extraction: ExtractionServiceLike;
  private readonly response: ResponseServiceLike;
  private readonly transactionRunner: TransactionRunner;

  constructor(deps: InterviewEngineDeps = {}) {
    this.documents = deps.documents ?? new DocumentRepository();
    this.fieldStates = deps.fieldStates ?? new FieldStateRepository();
    this.conversations = deps.conversations ?? new ConversationRepository();
    this.extraction = deps.extraction ?? new ExtractionService();
    this.response = deps.response ?? new ResponseService();
    const hasInjectedRepositories = !!deps.documents || !!deps.fieldStates || !!deps.conversations;
    this.transactionRunner =
      deps.transactionRunner ??
      (hasInjectedRepositories
        ? { run: async (callback) => callback({ documents: this.documents, fieldStates: this.fieldStates, conversations: this.conversations }) }
        : createDrizzleTransactionRunner());
  }

  async handleMessage(input: { documentId: string; userId: string; message: string }): Promise<Response> {
    const doc = await this.documents.findById(input.documentId);
    if (!doc) {
      return jsonErrorResponse(404, "DOCUMENT_NOT_FOUND", "Document not found");
    }
    if (!isDocumentOwner(doc, input.userId)) {
      return jsonErrorResponse(403, "FORBIDDEN", "Document belongs to another user");
    }
    if (doc.flow !== "master" && doc.flow !== "trainer") {
      return jsonErrorResponse(400, "FLOW_NOT_SUPPORTED", "Only master and trainer flows are supported");
    }

    const responseInput = await this.transactionRunner.run(async ({ documents, fieldStates, conversations }) => {
      await conversations.addMessage({ documentId: input.documentId, role: "user", content: input.message });
      const recentMessages = await conversations.recentMessages(input.documentId, 20);
      const flow = doc.flow as "master" | "trainer";
      const existingStates = await fieldStates.list(input.documentId, flow);
      const phase = flow === "master" ? getNextMasterPhase(existingStates) : getNextTrainerPhase(existingStates);

      const extracted = await this.extraction.extract({ message: input.message, phase, recentMessages });
      const pendingConfirmations = new Set(extracted.confirmedPendingFields.map((field) => stateKey(field.phaseKey, field.fieldKey)));

      for (const confirmed of extracted.confirmedPendingFields) {
        if (confirmed.flow !== flow) continue;
        const existing = existingStates.find(
          (state) => state.phaseKey === confirmed.phaseKey && state.fieldKey === confirmed.fieldKey && state.status === "pending_confirmation",
        );
        const pendingValue = getPendingSuggestionValue(existing?.pendingSuggestion);
        if (pendingValue === undefined) continue;
        await fieldStates.upsert({
          documentId: input.documentId,
          flow: confirmed.flow,
          phaseKey: confirmed.phaseKey,
          fieldKey: confirmed.fieldKey,
          value: pendingValue,
          status: "confirmed",
          source: "user_confirmed",
          pendingSuggestion: null,
        });
      }

      for (const patch of extracted.patches) {
        if (patch.flow !== flow) continue;
        if (pendingConfirmations.has(stateKey(patch.phaseKey, patch.fieldKey))) continue;
        const existing = existingStates.find((state) => state.phaseKey === patch.phaseKey && state.fieldKey === patch.fieldKey);
        if (existing?.status === "confirmed" && patch.source !== "user_confirmed") continue;
        await fieldStates.upsert({
          documentId: input.documentId,
          flow: patch.flow,
          phaseKey: patch.phaseKey,
          fieldKey: patch.fieldKey,
          value: patch.value,
          status: patch.source === "user_confirmed" ? "confirmed" : "captured",
          source: patch.source,
          ...(patch.confidence === undefined ? {} : { confidence: patch.confidence.toString() }),
          pendingSuggestion: null,
        });
      }

      for (const suggestion of extracted.pendingSuggestions) {
        if (suggestion.flow !== flow) continue;
        await fieldStates.upsert({
          documentId: input.documentId,
          flow: suggestion.flow,
          phaseKey: suggestion.phaseKey,
          fieldKey: suggestion.fieldKey,
          value: null,
          status: "pending_confirmation",
          source: "ai_suggested",
          pendingSuggestion: { value: suggestion.value, reason: suggestion.reason },
        });
      }

      const statesAfterExtraction = await fieldStates.list(input.documentId, flow);
      for (const generated of buildGeneratedFieldPatches(flow, statesAfterExtraction as FieldStateSnapshot[])) {
        await fieldStates.upsert({
          documentId: input.documentId,
          flow: generated.flow,
          phaseKey: generated.phaseKey,
          fieldKey: generated.fieldKey,
          value: generated.value,
          status: "captured",
          source: "system",
          pendingSuggestion: null,
        });
      }

      const updatedStates = await fieldStates.list(input.documentId, flow);
      const stateSnapshot = updatedStates as FieldStateSnapshot[];
      const readiness = flow === "master" ? buildMasterReadiness(stateSnapshot) : buildTrainerReadiness(stateSnapshot);
      const nextPhase = flow === "master" ? getNextMasterPhase(stateSnapshot) : getNextTrainerPhase(stateSnapshot);
      const masterJson = flow === "master" ? compileMasterJson(stateSnapshot) : compileTrainerJson(stateSnapshot);
      await documents.updateInterviewState(input.documentId, { masterJson, readiness, currentPhase: nextPhase });

      const capturedFields = stateSnapshot
        .filter((s) => ["captured", "confirmed"].includes(s.status) && s.value !== null && s.value !== undefined)
        .map((s) => ({ phaseKey: s.phaseKey, fieldKey: s.fieldKey, value: s.value }));

      return {
        message: input.message,
        phase: nextPhase,
        readiness,
        nextField: readiness.missing[0] ?? null,
        capturedFields,
        missingFields: readiness.missing,
        flow,
      };
    });

    const assistantResponse = await this.response.stream(responseInput);
    return persistAssistantMessageAfterStream(assistantResponse, async (assistantText) => {
      await this.conversations.addMessage({
        documentId: input.documentId,
        role: "assistant",
        content: assistantText,
        metadata: { phase: responseInput.phase, readiness: responseInput.readiness },
      });
    });
  }
}

function createDrizzleTransactionRunner(): TransactionRunner {
  return {
    run: async (callback) =>
      db.transaction((tx) =>
        callback({
          documents: new DocumentRepository(tx),
          fieldStates: new FieldStateRepository(tx),
          conversations: new ConversationRepository(tx),
        }),
      ),
  };
}

function stateKey(phaseKey: string, fieldKey: string): string {
  return `${phaseKey}.${fieldKey}`;
}

function getPendingSuggestionValue(pendingSuggestion: unknown): unknown {
  if (!pendingSuggestion || typeof pendingSuggestion !== "object" || !("value" in pendingSuggestion)) {
    return undefined;
  }
  return (pendingSuggestion as { value: unknown }).value;
}

function persistAssistantMessageAfterStream(response: Response, save: (assistantText: string) => Promise<void>): Response {
  if (!response.body) {
    return response;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let assistantText = "";

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        assistantText += decoder.decode();
        try {
          await save(assistantText);
        } catch (error) {
          console.error("Failed to persist assistant message", error);
        }
        controller.close();
        return;
      }

      assistantText += decoder.decode(value, { stream: true });
      controller.enqueue(value);
    },
    cancel(reason) {
      void reader.cancel(reason);
    },
  });

  return new Response(stream, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });
}

function jsonErrorResponse(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
