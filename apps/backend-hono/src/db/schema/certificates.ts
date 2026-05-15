import { pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { courses } from "./learning";
import { peserta } from "./people";

export const certificateTypeEnum = pgEnum("certificate_type", ["bnsp", "trainerhub"]);
export const certificateStatusEnum = pgEnum("certificate_status", ["not_submitted", "in_review", "approved", "rejected", "issued"]);

export const sertifikat = pgTable("sertifikat", {
	id: uuid("id").primaryKey().defaultRandom(),
	pesertaId: uuid("peserta_id")
		.notNull()
		.references(() => peserta.id, { onDelete: "cascade" }),
	courseId: uuid("course_id").references(() => courses.id, { onDelete: "set null" }),
	type: certificateTypeEnum("type").notNull().default("trainerhub"),
	status: certificateStatusEnum("status").default("issued").notNull(),
	certificateNumber: varchar("certificate_number", { length: 100 }).unique(),
	courseName: varchar("course_name", { length: 255 }),
	pesertaName: varchar("peserta_name", { length: 255 }),
	completedAt: timestamp("completed_at", { withTimezone: true }),
	nomorSertifikat: varchar("nomor_sertifikat", { length: 100 }),
	fileUrl: varchar("file_url", { length: 500 }),
	lsp: varchar("lsp", { length: 255 }),
	issuedDate: timestamp("issued_date", { withTimezone: true }),
	notes: text("notes"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Sertifikat = typeof sertifikat.$inferSelect;
export type NewSertifikat = typeof sertifikat.$inferInsert;
