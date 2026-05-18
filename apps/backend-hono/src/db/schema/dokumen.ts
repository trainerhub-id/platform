import { boolean, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { peserta } from './people'

export const dokumenStatusEnum = pgEnum('dokumen_status', ['pending', 'revisi', 'approved'])

export const dokumenKategori = pgTable('dokumen_kategori', {
  id: uuid('id').primaryKey().defaultRandom(),
  nama: varchar('nama', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const dokumenJenis = pgTable('dokumen_jenis', {
  id: uuid('id').primaryKey().defaultRandom(),
  kategoriId: uuid('kategori_id')
    .notNull()
    .references(() => dokumenKategori.id, { onDelete: 'cascade' }),
  namaJenis: varchar('nama_jenis', { length: 255 }).notNull(),
  opsional: boolean('opsional').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const dokumenPeserta = pgTable('dokumen_peserta', {
  id: uuid('id').primaryKey().defaultRandom(),
  pesertaId: uuid('peserta_id')
    .notNull()
    .references(() => peserta.id, { onDelete: 'cascade' }),
  jenisId: uuid('jenis_id')
    .notNull()
    .references(() => dokumenJenis.id, { onDelete: 'cascade' }),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  status: dokumenStatusEnum('status').default('pending').notNull(),
  catatanRevisi: varchar('catatan_revisi', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type DokumenKategori = typeof dokumenKategori.$inferSelect
export type DokumenJenis = typeof dokumenJenis.$inferSelect
export type DokumenPeserta = typeof dokumenPeserta.$inferSelect
