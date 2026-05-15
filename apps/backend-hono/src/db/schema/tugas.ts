import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { peserta } from "./people";

export const tugas = pgTable("tugas", {
	id: uuid("id").primaryKey().defaultRandom(),
	namaTugas: varchar("nama_tugas", { length: 255 }).notNull(),
	deskripsi: text("deskripsi"),
	tipeOutput: varchar("tipe_output", { length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tugasPeserta = pgTable("tugas_peserta", {
	id: uuid("id").primaryKey().defaultRandom(),
	pesertaId: uuid("peserta_id")
		.notNull()
		.references(() => peserta.id, { onDelete: "cascade" }),
	tugasId: uuid("tugas_id")
		.notNull()
		.references(() => tugas.id, { onDelete: "cascade" }),
	status: varchar("status", { length: 50 }),
	nilai: varchar("nilai", { length: 10 }),
	catatanTrainer: text("catatan_trainer"),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tugasPesertaUpload = pgTable("tugas_peserta_upload", {
	id: uuid("id").primaryKey().defaultRandom(),
	tugasPesertaId: uuid("tugas_peserta_id")
		.notNull()
		.references(() => tugasPeserta.id, { onDelete: "cascade" }),
	fileUrl: varchar("file_url", { length: 500 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Tugas = typeof tugas.$inferSelect;
export type TugasPeserta = typeof tugasPeserta.$inferSelect;
export type TugasPesertaUpload = typeof tugasPesertaUpload.$inferSelect;
