import { boolean, json, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { workspaces } from './workspaces'

export const todoStatusEnum = pgEnum('todo_status', [
  'todo',
  'in_progress',
  'waiting_review',
  'done',
])
export const todoCategoryEnum = pgEnum('todo_category', [
  'Pra-Training',
  'Training',
  'Pasca-Training',
  'Sertifikat',
  'Admin',
])

export const todos = pgTable('todos', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id'),
  key: text('key').notNull(),
  title: text('title').notNull(),
  category: todoCategoryEnum('category').notNull(),
  status: todoStatusEnum('status').default('todo').notNull(),
  isBlocking: boolean('is_blocking').default(false),
  meta: json('meta'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

export type Todo = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert
