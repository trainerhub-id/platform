import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { peserta } from './people'

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  totalChapters: integer('total_chapters').default(0),
  isActive: integer('is_active').default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const chapters = pgTable('chapters', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id')
    .references(() => courses.id, { onDelete: 'cascade' })
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  chapterId: uuid('chapter_id')
    .references(() => chapters.id, { onDelete: 'cascade' })
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  duration: varchar('duration', { length: 20 }),
  description: text('description'),
  videoUrl: text('video_url'),
  videoType: varchar('video_type', { length: 20 }).default('youtube'),
  muxUploadId: text('mux_upload_id'),
  muxAssetId: text('mux_asset_id'),
  muxPlaybackId: text('mux_playback_id'),
  thumbnailUrl: text('thumbnail_url'),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const pesertaCourseProgress = pgTable('peserta_course_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  pesertaId: uuid('peserta_id')
    .references(() => peserta.id, { onDelete: 'cascade' })
    .notNull(),
  lessonId: uuid('lesson_id')
    .references(() => lessons.id, { onDelete: 'cascade' })
    .notNull(),
  status: varchar('status', { length: 50 }).default('belum-mulai').notNull(),
  videoProgress: integer('video_progress').default(0).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Course = typeof courses.$inferSelect
export type Chapter = typeof chapters.$inferSelect
export type Lesson = typeof lessons.$inferSelect
export type PesertaCourseProgress = typeof pesertaCourseProgress.$inferSelect
