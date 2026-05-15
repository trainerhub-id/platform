import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { documents } from "../db/schema";

export type DocumentFlow = "master" | "trainer";

export function createDefaultMasterJson(flow: DocumentFlow) {
  if (flow === "master") {
    return {
      schema_key: "hono_master_alpha_v1",
      brainstorming_master: {},
      training: {},
      organizer: {},
      people: { trainer: { name: "" } },
      unit: {},
      competency_map: {},
    };
  }

  return {
    schema_key: "hono_trainer_alpha_v1",
    brainstorming: {},
    training: {},
    unit: {},
    competency_map: {},
  };
}

export function createDocumentRecord(input: { ownerUserId: string; flow: DocumentFlow; title: string }) {
  return {
    ownerUserId: input.ownerUserId,
    flow: input.flow,
    title: input.title,
    status: "draft",
    currentPhase: input.flow === "master" ? "profile" : "brainstorming",
    schemaVersion: input.flow === "master" ? "hono_master_alpha_v1" : "hono_trainer_alpha_v1",
    masterJson: createDefaultMasterJson(input.flow),
    readiness: { ready: false, missing: [] },
  };
}

export function isDocumentOwner(document: { ownerUserId: string }, userId: string): boolean {
  return document.ownerUserId === userId;
}

export class DocumentRepository {
  constructor(private readonly client: Pick<typeof db, "insert" | "select" | "update"> = db) {}

  async create(input: { ownerUserId: string; flow: DocumentFlow; title: string }) {
    const [created] = await this.client.insert(documents).values(createDocumentRecord(input)).returning();
    return created;
  }

  async listByOwner(ownerUserId: string) {
    return this.client
      .select()
      .from(documents)
      .where(and(eq(documents.ownerUserId, ownerUserId), isNull(documents.deletedAt)))
      .orderBy(desc(documents.updatedAt));
  }

  async findById(id: string) {
    const [doc] = await this.client.select().from(documents).where(and(eq(documents.id, id), isNull(documents.deletedAt))).limit(1);
    return doc ?? null;
  }

  async updateTitle(id: string, title: string) {
    const [updated] = await this.client.update(documents).set({ title, updatedAt: new Date() }).where(eq(documents.id, id)).returning();
    return updated ?? null;
  }

  async softDelete(id: string) {
    const [updated] = await this.client.update(documents).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(documents.id, id)).returning();
    return updated ?? null;
  }

  async updateInterviewState(id: string, input: { masterJson: unknown; readiness: unknown; currentPhase: string; status?: string }) {
    const [updated] = await this.client
      .update(documents)
      .set({
        masterJson: input.masterJson,
        readiness: input.readiness,
        currentPhase: input.currentPhase,
        status: input.status ?? "interviewing",
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id))
      .returning();
    return updated ?? null;
  }
}
