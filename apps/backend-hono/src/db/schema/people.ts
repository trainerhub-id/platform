import { pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const jkEnum = pgEnum("jk", ["L", "P"]);
export const paymentStatusEnum = pgEnum("payment_status", ["paid", "unpaid", "pending", "cancel"]);

export const peserta = pgTable("peserta", {
	id: uuid("id").primaryKey().defaultRandom(),
	clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
	nama: varchar("nama", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	noWa: varchar("no_wa", { length: 20 }),
	nik: varchar("nik", { length: 16 }),
	ttl: varchar("ttl", { length: 100 }),
	jk: jkEnum("jk"),
	alamat: text("alamat"),
	kota: varchar("kota", { length: 100 }),
	provinsi: varchar("provinsi", { length: 100 }),
	pendidikan: varchar("pendidikan", { length: 100 }),
	pekerjaan: varchar("pekerjaan", { length: 100 }),
	tShirtSize: varchar("t_shirt_size", { length: 10 }),
	paymentStatus: paymentStatusEnum("payment_status").default("pending"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const admin = pgTable("admin", {
	id: uuid("id").primaryKey().defaultRandom(),
	clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
	nama: varchar("nama", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Peserta = typeof peserta.$inferSelect;
export type Admin = typeof admin.$inferSelect;
