import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { users } from './auth'

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: text('owner_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    flow: text('flow').notNull(),
    title: text('title').notNull(),
    status: text('status').notNull().default('draft'),
    currentPhase: text('current_phase').notNull().default('profile'),
    schemaVersion: text('schema_version').notNull().default('hono_alpha_v1'),
    masterJson: jsonb('master_json').notNull().default({}),
    readiness: jsonb('readiness').notNull().default({ ready: false, missing: [] }),
    generationConfirmedAt: timestamp('generation_confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    ownerUpdatedIdx: index('documents_owner_updated_idx').on(table.ownerUserId, table.updatedAt),
    flowStatusIdx: index('documents_flow_status_idx').on(table.flow, table.status),
  }),
)

export const documentMasterProfiles = pgTable('document_master_profiles', {
  documentId: uuid('document_id')
    .primaryKey()
    .references(() => documents.id, { onDelete: 'cascade' }),
  organizationName: text('organization_name'),
  trainerName: text('trainer_name'),
  organizationCity: text('organization_city'),
  organizationFocus: text('organization_focus'),
  programName: text('program_name'),
  programGoal: text('program_goal'),
  targetParticipants: text('target_participants'),
  industryProblem: text('industry_problem'),
  trainingLocation: text('training_location'),
  trainingDuration: text('training_duration'),
  deliveryMethod: text('delivery_method'),
  evaluationMethods: text('evaluation_methods'),
  selectedUnitCode: text('selected_unit_code'),
  selectedUnitTitle: text('selected_unit_title'),
  selectedUnitSource: text('selected_unit_source'),
  skkniMapReady: boolean('skkni_map_ready').notNull().default(false),
  unitDetailReady: boolean('unit_detail_ready').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const documentTrainerProfiles = pgTable('document_trainer_profiles', {
  documentId: uuid('document_id')
    .primaryKey()
    .references(() => documents.id, { onDelete: 'cascade' }),
  trainerName: text('trainer_name'),
  expertise: text('expertise'),
  activities: text('activities'),
  audience: text('audience'),
  outcome: text('outcome'),
  trainingObjective: text('training_objective'),
  trainingDate: text('training_date'),
  institution: text('institution'),
  selectedUnitCode: text('selected_unit_code'),
  selectedUnitTitle: text('selected_unit_title'),
  programName: text('program_name'),
  deliveryMethod: text('delivery_method'),
  durationJp: integer('duration_jp'),
  unitDetailReady: boolean('unit_detail_ready').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const documentFieldStates = pgTable(
  'document_field_states',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    flow: text('flow').notNull(),
    phaseKey: text('phase_key').notNull(),
    fieldKey: text('field_key').notNull(),
    value: jsonb('value'),
    status: text('status').notNull(),
    source: text('source').notNull(),
    confidence: numeric('confidence'),
    evidenceMessageId: uuid('evidence_message_id'),
    pendingSuggestion: jsonb('pending_suggestion'),
    rejectionReason: text('rejection_reason'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    documentIdIdx: index('document_field_states_document_id_idx').on(table.documentId),
    uniqueFieldState: uniqueIndex('document_field_states_unique_idx').on(
      table.documentId,
      table.flow,
      table.phaseKey,
      table.fieldKey,
    ),
  }),
)

export const conversationMessages = pgTable(
  'conversation_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    documentCreatedIdx: index('conversation_messages_document_created_idx').on(
      table.documentId,
      table.createdAt,
    ),
  }),
)

export const conversationSummaries = pgTable('conversation_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id')
    .notNull()
    .unique()
    .references(() => documents.id, { onDelete: 'cascade' }),
  summary: text('summary').notNull(),
  coveredUntilMessageId: uuid('covered_until_message_id'),
  metadata: jsonb('metadata').notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const documentPayloadSnapshots = pgTable(
  'document_payload_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    flow: text('flow').notNull(),
    documentType: text('document_type').notNull(),
    payload: jsonb('payload').notNull(),
    payloadHash: text('payload_hash').notNull(),
    schemaVersion: text('schema_version').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    documentTypeCreatedIdx: index('document_payload_snapshots_document_type_created_idx').on(
      table.documentId,
      table.documentType,
      table.createdAt,
    ),
    documentTypeHashUnique: uniqueIndex(
      'document_payload_snapshots_document_type_hash_unique_idx',
    ).on(table.documentId, table.documentType, table.payloadHash),
  }),
)

export const generationJobs = pgTable(
  'generation_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    bossJobId: text('boss_job_id'),
    jobType: text('job_type').notNull(),
    requestKey: text('request_key').notNull(),
    status: text('status').notNull(),
    input: jsonb('input').notNull(),
    error: jsonb('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    jobRequestUnique: uniqueIndex('generation_jobs_job_request_unique_idx').on(
      table.jobType,
      table.requestKey,
    ),
    documentCreatedIdx: index('generation_jobs_document_created_idx').on(
      table.documentId,
      table.createdAt,
    ),
  }),
)

export const generatedFiles = pgTable(
  'generated_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    generationJobId: uuid('generation_job_id')
      .notNull()
      .references(() => generationJobs.id, { onDelete: 'cascade' }),
    documentType: text('document_type').notNull(),
    outputFormat: text('output_format').notNull(),
    filePath: text('file_path').notNull(),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes'),
    checksum: text('checksum'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    documentCreatedIdx: index('generated_files_document_created_idx').on(
      table.documentId,
      table.createdAt,
    ),
    jobIdx: index('generated_files_generation_job_idx').on(table.generationJobId),
  }),
)
