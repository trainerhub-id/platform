import { describe, expect, it } from "vitest";
import type { ExtractionServiceLike } from "../ai/extraction.service";
import type { ResponseServiceLike } from "../ai/response.service";
import { InterviewEngine } from "./interview-engine";

class FakeFieldStateRepository {
  states: any[] = [];
  async list() {
    return this.states;
  }
  async upsert(input: any) {
    const snapshot = {
      flow: input.flow,
      phaseKey: input.phaseKey,
      fieldKey: input.fieldKey,
      status: input.status,
      source: input.source,
      value: input.value,
      pendingSuggestion: input.pendingSuggestion ?? null,
    };
    this.states = this.states.filter(
      (state) => !(state.flow === snapshot.flow && state.phaseKey === snapshot.phaseKey && state.fieldKey === snapshot.fieldKey),
    );
    this.states.push(snapshot);
    return input;
  }
}

class FakeConversationRepository {
  messages: any[] = [];
  async addMessage(input: any) {
    this.messages.push(input);
    return { id: `msg_${this.messages.length}`, ...input };
  }
  async recentMessages() {
    return this.messages;
  }
}

class FakeDocumentRepository {
  doc: any = { id: "doc_1", ownerUserId: "user_1", flow: "master", title: "Doc" };
  updated: any = null;
  async findById() {
    return this.doc;
  }
  async updateInterviewState(id: string, input: any) {
    this.updated = { id, ...input };
    return this.updated;
  }
}

const fakeExtraction: ExtractionServiceLike = {
  async extract() {
    return {
      patches: [
        {
          flow: "master",
          phaseKey: "profile",
          fieldKey: "organization_name",
          value: "PT Maju Jaya",
          source: "user_explicit",
          confidence: 0.9,
        },
      ],
      pendingSuggestions: [],
      confirmedPendingFields: [],
      generateConfirmed: false,
    };
  },
};

const fakeResponse: ResponseServiceLike = {
  async stream() {
    return new Response("Oke, nama lembaga saya catat. Siapa trainernya?");
  },
};

describe("InterviewEngine", () => {
  it("saves user message, field patch, updates state, and returns stream response", async () => {
    const fieldStates = new FakeFieldStateRepository();
    const conversations = new FakeConversationRepository();
    const documents = new FakeDocumentRepository();
    const engine = new InterviewEngine({
      documents: documents as any,
      fieldStates: fieldStates as any,
      conversations: conversations as any,
      extraction: fakeExtraction,
      response: fakeResponse,
    });

    const response = await engine.handleMessage({ documentId: "doc_1", userId: "user_1", message: "Lembaganya PT Maju Jaya" });

    expect(response.status).toBe(200);
    expect(fieldStates.states[0].fieldKey).toBe("organization_name");
    expect(documents.updated.masterJson.brainstorming_master.organization_name).toBe("PT Maju Jaya");
    expect(documents.updated.readiness.ready).toBe(false);
    expect(documents.updated.currentPhase).toBe("profile");
    expect(conversations.messages.map((message) => message.role)).toEqual(["user", "assistant"]);
    expect(await response.text()).toBe("Oke, nama lembaga saya catat. Siapa trainernya?");
  });

  it("confirms pending suggestions and compiles confirmed value into master_json", async () => {
    const fieldStates = new FakeFieldStateRepository();
    fieldStates.states = [
      {
        flow: "master",
        phaseKey: "profile",
        fieldKey: "program_name",
        status: "pending_confirmation",
        source: "ai_suggested",
        value: null,
        pendingSuggestion: { value: "Pelatihan Digital Marketing untuk UMKM", reason: "Sesuai konteks" },
      },
    ];
    const conversations = new FakeConversationRepository();
    const documents = new FakeDocumentRepository();
    const engine = new InterviewEngine({
      documents: documents as any,
      fieldStates: fieldStates as any,
      conversations: conversations as any,
      extraction: {
        async extract() {
          return {
            patches: [],
            pendingSuggestions: [],
            confirmedPendingFields: [{ flow: "master", phaseKey: "profile", fieldKey: "program_name" }],
            generateConfirmed: false,
          };
        },
      },
      response: fakeResponse,
    });

    await engine.handleMessage({ documentId: "doc_1", userId: "user_1", message: "iya pakai itu" });

    const state = fieldStates.states.find((item) => item.phaseKey === "profile" && item.fieldKey === "program_name");
    expect(state).toMatchObject({
      status: "confirmed",
      source: "user_confirmed",
      value: "Pelatihan Digital Marketing untuk UMKM",
      pendingSuggestion: null,
    });
    expect(documents.updated.masterJson.brainstorming_master.program_name).toBe("Pelatihan Digital Marketing untuk UMKM");
  });

  it("preserves existing confirmed values from user_explicit patches", async () => {
    const fieldStates = new FakeFieldStateRepository();
    fieldStates.states = [
      {
        flow: "master",
        phaseKey: "profile",
        fieldKey: "organization_name",
        status: "confirmed",
        source: "user_confirmed",
        value: "PT Final",
        pendingSuggestion: null,
      },
    ];
    const conversations = new FakeConversationRepository();
    const documents = new FakeDocumentRepository();
    const engine = new InterviewEngine({
      documents: documents as any,
      fieldStates: fieldStates as any,
      conversations: conversations as any,
      extraction: fakeExtraction,
      response: fakeResponse,
    });

    await engine.handleMessage({ documentId: "doc_1", userId: "user_1", message: "Lembaganya PT Draft" });

    const state = fieldStates.states.find((item) => item.phaseKey === "profile" && item.fieldKey === "organization_name");
    expect(state.value).toBe("PT Final");
    expect(state.status).toBe("confirmed");
    expect(documents.updated.masterJson.brainstorming_master.organization_name).toBe("PT Final");
  });

  it("handles trainer field patches with trainer compiler and readiness", async () => {
    const fieldStates = new FakeFieldStateRepository();
    const conversations = new FakeConversationRepository();
    const documents = new FakeDocumentRepository();
    documents.doc = { id: "doc_1", ownerUserId: "user_1", flow: "trainer", title: "Trainer Doc" };
    const engine = new InterviewEngine({
      documents: documents as any,
      fieldStates: fieldStates as any,
      conversations: conversations as any,
      extraction: {
        async extract() {
          return {
            patches: [
              { flow: "trainer", phaseKey: "brainstorming", fieldKey: "trainer_name", value: "Budi", source: "user_explicit", confidence: 0.9 },
              { flow: "trainer", phaseKey: "brainstorming", fieldKey: "expertise", value: "Digital Marketing", source: "user_explicit", confidence: 0.9 },
            ],
            pendingSuggestions: [],
            confirmedPendingFields: [],
            generateConfirmed: false,
          };
        },
      },
      response: fakeResponse,
    });

    const response = await engine.handleMessage({ documentId: "doc_1", userId: "user_1", message: "Trainernya Budi, bidang Digital Marketing" });

    expect(response.status).toBe(200);
    expect(documents.updated.masterJson.schema_key).toBe("hono_trainer_alpha_v1");
    expect(documents.updated.masterJson.brainstorming.trainer_name).toBe("Budi");
    expect(documents.updated.masterJson.brainstorming.expertise).toBe("Digital Marketing");
    expect(documents.updated.currentPhase).toBe("brainstorming");
    expect(fieldStates.states.every((state) => state.flow === "trainer")).toBe(true);
  });

  it("runs core state changes inside a transaction seam", async () => {
    const fieldStates = new FakeFieldStateRepository();
    const conversations = new FakeConversationRepository();
    const documents = new FakeDocumentRepository();
    let transactionCalls = 0;
    const engine = new InterviewEngine({
      documents: documents as any,
      fieldStates: fieldStates as any,
      conversations: conversations as any,
      extraction: fakeExtraction,
      response: fakeResponse,
      transactionRunner: {
        async run(callback) {
          transactionCalls += 1;
          return callback({ documents: documents as any, fieldStates: fieldStates as any, conversations: conversations as any });
        },
      },
    });

    await engine.handleMessage({ documentId: "doc_1", userId: "user_1", message: "Lembaganya PT Maju Jaya" });

    expect(transactionCalls).toBe(1);
  });
});
