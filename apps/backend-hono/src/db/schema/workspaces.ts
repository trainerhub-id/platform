import { index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { pesertaBatch, batchTraining } from './batch'
import { courses } from './learning'
import { peserta } from './people'
import { users } from './auth'

export const workspaceStatusValues = ['active', 'archived', 'suspended'] as const

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 80 }).notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    pesertaId: uuid('peserta_id')
      .notNull()
      .references(() => peserta.id, { onDelete: 'cascade' }),
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => pesertaBatch.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => batchTraining.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userSlugUnique: uniqueIndex('workspaces_user_slug_unique').on(table.userId, table.slug),
    enrollmentUnique: uniqueIndex('workspaces_enrollment_unique').on(table.enrollmentId),
    userStatusIdx: index('workspaces_user_status_idx').on(table.userId, table.status),
    batchIdx: index('workspaces_batch_idx').on(table.batchId),
  }),
)

export type Workspace = typeof workspaces.$inferSelect
export type NewWorkspace = typeof workspaces.$inferInsert
