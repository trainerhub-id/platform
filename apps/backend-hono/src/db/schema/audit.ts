import { jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { batchTraining, pesertaBatch } from "./batch";
import { peserta } from "./people";

export const auditLogs = pgTable("audit_logs", {
	id: uuid("id").primaryKey().defaultRandom(),
	actorUserId: text("actor_user_id"),
	actorEmail: varchar("actor_email", { length: 255 }),
	actorName: varchar("actor_name", { length: 255 }),
	action: varchar("action", { length: 120 }).notNull(),
	entityType: varchar("entity_type", { length: 80 }).notNull(),
	entityId: text("entity_id").notNull(),
	batchId: uuid("batch_id").references(() => batchTraining.id, { onDelete: "set null" }),
	enrollmentId: uuid("enrollment_id").references(() => pesertaBatch.id, { onDelete: "set null" }),
	pesertaId: uuid("peserta_id").references(() => peserta.id, { onDelete: "set null" }),
	before: jsonb("before").$type<Record<string, unknown> | null>(),
	after: jsonb("after").$type<Record<string, unknown> | null>(),
	metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
	requestId: text("request_id"),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
