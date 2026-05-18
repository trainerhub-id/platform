import { useEffect, useState } from 'react'
import api from 'src/api/axios'

export interface Lesson {
  id: string
  title: string
  duration: string
  description: string | null
  videoUrl: string | null
  muxPlaybackId?: string | null
  thumbnailUrl: string | null
  orderIndex: number
  status?: 'belum-mulai' | 'sedang-diproses' | 'selesai'
  completedAt?: Date | null
  videoProgress?: number // in seconds
}

export interface Chapter {
  id: string
  title: string
  orderIndex: number
  lessons: Lesson[]
}

export interface CourseDetail {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  totalChapters: number
  chapters: Chapter[]
  progress?: number
  completedChapters?: number
}

export const useKelas = (courseId?: string) => {
  const [selectedKelas, setSelectedKelas] = useState<CourseDetail | null>(null)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (courseId) {
      fetchCourseDetail(courseId)
    } else {
      setLoading(false)
    }
  }, [courseId])

  const fetchCourseDetail = async (courseId: string) => {
    try {
      setLoading(true)
      const response = await api.get(`/kelas/${courseId}`)
      const courseData = response.data

      // Calculate progress
      let totalLessons = 0
      let completedLessons = 0
      courseData.chapters.forEach((chapter: Chapter) => {
        chapter.lessons.forEach((lesson: Lesson) => {
          totalLessons++
          if (lesson.status === 'selesai') {
            completedLessons++
          }
        })
      })

      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

      const enrichedCourse = {
        ...courseData,
        progress,
        completedChapters: courseData.chapters.filter((ch: Chapter) =>
          ch.lessons.every((l) => l.status === 'selesai'),
        ).length,
      }

      setSelectedKelas(enrichedCourse)

      // Auto-select first lesson
      if (enrichedCourse.chapters.length > 0 && enrichedCourse.chapters[0].lessons.length > 0) {
        setActiveLesson(enrichedCourse.chapters[0].lessons[0])
      }
    } catch (err) {
      console.error('Error fetching course detail:', err)
    } finally {
      setLoading(false)
    }
  }

  const markLessonComplete = async (lessonId: string, status: 'belum-mulai' | 'selesai') => {
    if (!selectedKelas) return

    try {
      // Optimistic update
      const updatedChapters = selectedKelas.chapters.map((ch) => ({
        ...ch,
        lessons: ch.lessons.map((l) =>
          l.id === lessonId
            ? { ...l, status, videoProgress: status === 'selesai' ? 0 : l.videoProgress }
            : l,
        ),
      }))

      // Recalculate progress
      let totalLessons = 0
      let completedLessons = 0
      updatedChapters.forEach((ch) => {
        ch.lessons.forEach((l) => {
          totalLessons++
          if (l.status === 'selesai') completedLessons++
        })
      })

      const newProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

      setSelectedKelas({
        ...selectedKelas,
        chapters: updatedChapters,
        progress: newProgress,
        completedChapters: updatedChapters.filter((ch) =>
          ch.lessons.every((l) => l.status === 'selesai'),
        ).length,
      })

      // Update Active Lesson State if it matches
      if (activeLesson && activeLesson.id === lessonId) {
        setActiveLesson({
          ...activeLesson,
          status,
          videoProgress: status === 'selesai' ? 0 : activeLesson.videoProgress,
        })
      }

      await api.patch(`/kelas/${selectedKelas.id}/lesson/${lessonId}/progress`, {
        status,
        videoProgress: status === 'selesai' ? 0 : undefined,
      })
    } catch (err) {
      console.error('Error updating progress:', err)
      // Revert on error would be ideal here but skipping for brevity
    }
  }

  const saveVideoProgress = async (lessonId: string, progressInSeconds: number) => {
    if (!selectedKelas) return

    // Validate progress value
    if (progressInSeconds < 0 || !isFinite(progressInSeconds)) {
      console.warn('Invalid video progress value:', progressInSeconds)
      return
    }

    try {
      await api.patch(`/kelas/${selectedKelas.id}/lesson/${lessonId}/progress`, {
        videoProgress: Math.floor(progressInSeconds),
      })
    } catch (err) {
      console.error('Failed to save video progress:', err)
      // Silent fail - don't disrupt user experience
    }
  }

  const goToNextLesson = () => {
    if (!selectedKelas || !activeLesson) return

    // Find current position
    let currentChapterIdx = -1
    let currentLessonIdx = -1

    selectedKelas.chapters.forEach((ch, cIdx) => {
      const lIdx = ch.lessons.findIndex((l) => l.id === activeLesson.id)
      if (lIdx !== -1) {
        currentChapterIdx = cIdx
        currentLessonIdx = lIdx
      }
    })

    if (currentChapterIdx === -1) return

    const currentChapter = selectedKelas.chapters[currentChapterIdx]

    // Check if there is a next lesson in current chapter
    if (currentLessonIdx < currentChapter.lessons.length - 1) {
      setActiveLesson(currentChapter.lessons[currentLessonIdx + 1])
    }
    // Else check if there is a next chapter
    else if (currentChapterIdx < selectedKelas.chapters.length - 1) {
      const nextChapter = selectedKelas.chapters[currentChapterIdx + 1]
      if (nextChapter.lessons.length > 0) {
        setActiveLesson(nextChapter.lessons[0])
      }
    }
  }

  const goToPrevLesson = () => {
    if (!selectedKelas || !activeLesson) return

    let currentChapterIdx = -1
    let currentLessonIdx = -1

    selectedKelas.chapters.forEach((ch, cIdx) => {
      const lIdx = ch.lessons.findIndex((l) => l.id === activeLesson.id)
      if (lIdx !== -1) {
        currentChapterIdx = cIdx
        currentLessonIdx = lIdx
      }
    })

    if (currentChapterIdx === -1) return

    const currentChapter = selectedKelas.chapters[currentChapterIdx]

    // Check if there is a prev lesson in current chapter
    if (currentLessonIdx > 0) {
      setActiveLesson(currentChapter.lessons[currentLessonIdx - 1])
    }
    // Else check if there is a prev chapter
    else if (currentChapterIdx > 0) {
      const prevChapter = selectedKelas.chapters[currentChapterIdx - 1]
      if (prevChapter.lessons.length > 0) {
        // Go to last lesson of prev chapter
        setActiveLesson(prevChapter.lessons[prevChapter.lessons.length - 1])
      }
    }
  }

  // Helper for display
  const currentLessonDisplay = () => {
    if (!selectedKelas || !activeLesson) return { chapter: 0, totalChapters: 0 }

    const chapter = selectedKelas.chapters.find((ch) =>
      ch.lessons.some((l) => l.id === activeLesson.id),
    )
    const chapterIndex = selectedKelas.chapters.findIndex((ch) => ch.id === chapter?.id)

    return {
      chapter: chapterIndex + 1,
      totalChapters: selectedKelas.chapters.length,
    }
  }

  return {
    selectedKelas,
    activeLesson,
    setActiveLesson,
    loading,
    markLessonComplete,
    goToNextLesson,
    goToPrevLesson,
    currentLessonDisplay,
    saveVideoProgress,
  }
}
