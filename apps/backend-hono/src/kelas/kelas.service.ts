import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import {
  batchTiers,
  chapters,
  courses,
  lessons,
  peserta,
  pesertaBatch,
  pesertaCourseProgress,
} from '../db/schema'

type LessonProgressInput = {
  status?: 'belum-mulai' | 'sedang-diproses' | 'selesai' | undefined
  videoProgress?: number | undefined
}

export class KelasService {
  async findPesertaByUserId(userId: string) {
    const [row] = await db.select().from(peserta).where(eq(peserta.clerkId, userId)).limit(1)
    return row ?? null
  }

  async getAllCourses(pesertaId?: string) {
    const allCourses = await db.select().from(courses).where(eq(courses.isActive, 1))
    if (!pesertaId) {
      return allCourses.map((course) => ({
        ...course,
        hasAccess: true,
        progress: 0,
        completedLessons: 0,
        totalLessons: 0,
      }))
    }

    const accessibleCourseIds = await this.getAccessibleCourseIds(pesertaId)
    const stats = await this.getCourseStats(pesertaId, Array.from(accessibleCourseIds))

    return allCourses.map((course) => {
      const hasAccess = accessibleCourseIds.has(course.id)
      const courseStats = stats.get(course.id) ?? { total: 0, completed: 0 }
      return {
        ...course,
        hasAccess,
        totalLessons: hasAccess ? courseStats.total : 0,
        completedLessons: hasAccess ? courseStats.completed : 0,
        progress:
          hasAccess && courseStats.total > 0
            ? Math.round((courseStats.completed / courseStats.total) * 100)
            : 0,
      }
    })
  }

  async getCourseDetail(courseId: string, pesertaId?: string) {
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1)
    if (!course) throw new Error('COURSE_NOT_FOUND')

    const courseChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.courseId, courseId))
      .orderBy(chapters.orderIndex)
    const chapterIds = courseChapters.map((chapter) => chapter.id)
    const courseLessons =
      chapterIds.length > 0
        ? await db
            .select()
            .from(lessons)
            .where(inArray(lessons.chapterId, chapterIds))
            .orderBy(lessons.orderIndex)
        : []
    const progressRows =
      pesertaId && courseLessons.length > 0
        ? await db
            .select()
            .from(pesertaCourseProgress)
            .where(
              and(
                eq(pesertaCourseProgress.pesertaId, pesertaId),
                inArray(
                  pesertaCourseProgress.lessonId,
                  courseLessons.map((lesson) => lesson.id),
                ),
              ),
            )
        : []
    const progressMap = new Map(progressRows.map((row) => [row.lessonId, row]))
    const lessonsByChapter = new Map<string, unknown[]>()
    for (const lesson of courseLessons) {
      const progress = progressMap.get(lesson.id)
      const enriched = {
        ...lesson,
        status: progress?.status ?? 'belum-mulai',
        completedAt: progress?.completedAt ?? null,
        videoProgress: progress?.videoProgress ?? 0,
      }
      lessonsByChapter.set(lesson.chapterId, [
        ...(lessonsByChapter.get(lesson.chapterId) ?? []),
        enriched,
      ])
    }

    return {
      ...course,
      chapters: courseChapters.map((chapter) => ({
        ...chapter,
        lessons: lessonsByChapter.get(chapter.id) ?? [],
      })),
    }
  }

  async updateLessonProgress(pesertaId: string, lessonId: string, input: LessonProgressInput) {
    const [existing] = await db
      .select()
      .from(pesertaCourseProgress)
      .where(
        and(
          eq(pesertaCourseProgress.pesertaId, pesertaId),
          eq(pesertaCourseProgress.lessonId, lessonId),
        ),
      )
      .limit(1)

    const values = {
      status: input.status,
      videoProgress: input.status === 'selesai' ? 0 : input.videoProgress,
      completedAt: input.status === 'selesai' ? new Date() : input.status ? null : undefined,
      updatedAt: new Date(),
    }

    if (existing) {
      const [row] = await db
        .update(pesertaCourseProgress)
        .set(values)
        .where(eq(pesertaCourseProgress.id, existing.id))
        .returning()
      return row
    }

    const [row] = await db
      .insert(pesertaCourseProgress)
      .values({
        pesertaId,
        lessonId,
        status: input.status ?? 'belum-mulai',
        videoProgress: input.videoProgress ?? 0,
        completedAt: input.status === 'selesai' ? new Date() : null,
      })
      .returning()
    return row
  }

  async getPlaybackToken() {
    return { token: null }
  }

  private async getAccessibleCourseIds(pesertaId: string) {
    const enrollments = await db
      .select({ courseIds: batchTiers.courseIds })
      .from(pesertaBatch)
      .leftJoin(batchTiers, eq(pesertaBatch.tierId, batchTiers.id))
      .where(and(eq(pesertaBatch.pesertaId, pesertaId), eq(pesertaBatch.paymentStatus, 'paid')))
    return new Set(
      enrollments.flatMap((enrollment) =>
        Array.isArray(enrollment.courseIds) ? enrollment.courseIds : [],
      ),
    )
  }

  private async getCourseStats(pesertaId: string, courseIds: string[]) {
    const stats = new Map<string, { total: number; completed: number }>()
    if (courseIds.length === 0) return stats
    const courseChapters = await db
      .select({ id: chapters.id, courseId: chapters.courseId })
      .from(chapters)
      .where(inArray(chapters.courseId, courseIds))
    if (courseChapters.length === 0) return stats
    const chapterIds = courseChapters.map((chapter) => chapter.id)
    const courseLessons = await db
      .select({ id: lessons.id, chapterId: lessons.chapterId })
      .from(lessons)
      .where(inArray(lessons.chapterId, chapterIds))
    if (courseLessons.length === 0) return stats
    const progressRows = await db
      .select({ lessonId: pesertaCourseProgress.lessonId, status: pesertaCourseProgress.status })
      .from(pesertaCourseProgress)
      .where(
        and(
          eq(pesertaCourseProgress.pesertaId, pesertaId),
          inArray(
            pesertaCourseProgress.lessonId,
            courseLessons.map((lesson) => lesson.id),
          ),
        ),
      )
    const progressMap = new Map(progressRows.map((row) => [row.lessonId, row.status]))
    const chapterCourseMap = new Map(
      courseChapters.map((chapter) => [chapter.id, chapter.courseId]),
    )
    for (const lesson of courseLessons) {
      const courseId = chapterCourseMap.get(lesson.chapterId)
      if (!courseId) continue
      const current = stats.get(courseId) ?? { total: 0, completed: 0 }
      current.total += 1
      if (progressMap.get(lesson.id) === 'selesai') current.completed += 1
      stats.set(courseId, current)
    }
    return stats
  }
}
