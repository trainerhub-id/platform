import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { courses } from './learning'
import { peserta } from './people'

export const trainer = pgTable('trainer', {
  id: uuid('id').primaryKey().defaultRandom(),
  nama: varchar('nama', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  fotoUrl: text('foto_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const batchTraining = pgTable(
  'batch_training',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batchNumber: integer('batch_number').notNull(),
    namaBatch: varchar('nama_batch', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    tanggal: timestamp('tanggal', { withTimezone: true }).notNull(),
    tanggalSelesai: timestamp('tanggal_selesai', { withTimezone: true }),
    hotel: varchar('hotel', { length: 255 }),
    alamat: text('alamat'),
    mapsLink: text('maps_link'),
    imageUrl: text('image_url'),
    status: varchar('status', { length: 50 }).default('draft').notNull(),
    rundownTemplateId: integer('rundown_template_id'),
    courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
    trainerId: uuid('trainer_id').references(() => trainer.id, { onDelete: 'set null' }),
    latitude: numeric('latitude'),
    longitude: numeric('longitude'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    courseBatchUnique: uniqueIndex('batch_training_course_batch_number_unique').on(
      table.courseId,
      table.batchNumber,
    ),
  }),
)

export const tierTemplates = pgTable('tier_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  defaultCourseIds: jsonb('default_course_ids').$type<string[] | null>(),
  defaultAiFeatures: jsonb('default_ai_features').$type<string[] | null>(),
  defaultBenefits: jsonb('default_benefits').$type<string[] | null>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const batchTiers = pgTable('batch_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id')
    .notNull()
    .references(() => batchTraining.id, { onDelete: 'cascade' }),
  tierTemplateId: uuid('tier_template_id').references(() => tierTemplates.id, {
    onDelete: 'restrict',
  }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  price: integer('price').notNull().default(0),
  maxParticipants: integer('max_participants'),
  courseIds: jsonb('course_ids').$type<string[] | null>(),
  aiFeatures: jsonb('ai_features').$type<string[] | null>(),
  benefits: jsonb('benefits').$type<string[] | null>(),
  scalevStoreUniqueId: text('scalev_store_unique_id'),
  scalevVariantUniqueId: text('scalev_variant_unique_id'),
  scalevBundlePriceOptionUniqueId: text('scalev_bundle_price_option_unique_id'),
  scalevSyncStatus: varchar('scalev_sync_status', { length: 30 }).default('not_synced').notNull(),
  scalevLastSyncedAt: timestamp('scalev_last_synced_at', { withTimezone: true }),
  scalevSyncError: text('scalev_sync_error'),
  orderIndex: integer('order_index').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const pesertaBatch = pgTable('peserta_batch', {
  id: uuid('id').primaryKey().defaultRandom(),
  pesertaId: uuid('peserta_id')
    .notNull()
    .references(() => peserta.id, { onDelete: 'cascade' }),
  batchId: uuid('batch_id')
    .notNull()
    .references(() => batchTraining.id, { onDelete: 'cascade' }),
  tierId: uuid('tier_id').references(() => batchTiers.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).default('registered').notNull(),
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const paymentSessions = pgTable('payment_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  whatsapp: varchar('whatsapp', { length: 20 }),
  batchId: uuid('batch_id').references(() => batchTraining.id, { onDelete: 'set null' }),
  tierId: uuid('tier_id').references(() => batchTiers.id, { onDelete: 'set null' }),
  pesertaId: uuid('peserta_id').references(() => peserta.id, { onDelete: 'set null' }),
  enrollmentId: uuid('enrollment_id').references(() => pesertaBatch.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }),
  batchNameSnapshot: varchar('batch_name_snapshot', { length: 255 }),
  tierNameSnapshot: varchar('tier_name_snapshot', { length: 255 }),
  xenditSessionId: varchar('xendit_session_id', { length: 255 }),
  xenditPaymentLinkUrl: text('xendit_payment_link_url'),
  xenditReferenceId: varchar('xendit_reference_id', { length: 255 }),
  provider: varchar('provider', { length: 50 }).default('scalev').notNull(),
  providerOrderId: integer('provider_order_id'),
  providerOrderCode: varchar('provider_order_code', { length: 255 }),
  providerReferenceId: varchar('provider_reference_id', { length: 255 }),
  providerPaymentMethod: varchar('provider_payment_method', { length: 50 }),
  providerSubPaymentMethod: varchar('provider_sub_payment_method', { length: 50 }),
  providerCheckoutUrl: text('provider_checkout_url'),
  providerQrString: text('provider_qr_string'),
  providerVaNumber: varchar('provider_va_number', { length: 255 }),
  providerExpiresAt: timestamp('provider_expires_at', { withTimezone: true }),
  providerPayload: jsonb('provider_payload').$type<Record<string, unknown> | null>(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }),
  amount: integer('amount').notNull().default(0),
  currency: varchar('currency', { length: 3 }).default('IDR').notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  claimToken: text('claim_token'),
  claimTokenUsed: boolean('claim_token_used').default(false).notNull(),
  clerkSignInToken: text('clerk_sign_in_token'),
  clerkTokenExpiry: timestamp('clerk_token_expiry', { withTimezone: true }),
  paymentUrl: text('payment_url'),
  referenceId: text('reference_id'),
  expiredAt: timestamp('expired_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
