import { Icon } from '@iconify/react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import CardBox from 'src/components/shared/CardBox'
import { CourseCompletionModal } from 'src/components/shared/CourseCompletionModal'
import CourseLessonItem from 'src/components/shared/CourseLessonItem'
import LazyMuxPlayer from 'src/components/shared/LazyMuxPlayer'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Loading } from 'src/components/ui/loading'
import { useAuth } from 'src/lib/better-auth'
import {
  extractGoogleDriveId,
  extractYouTubeId,
  getGoogleDriveEmbedUrl,
  isGoogleDriveUrl,
  isYouTubeUrl,
} from 'src/utils/videoHelpers'
import { useKelas } from './hooks/useKelas'
import './kelas.css'

const Kelas = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const {
    selectedKelas,
    activeLesson,
    setActiveLesson,
    loading,
    markLessonComplete,
    goToNextLesson,
    goToPrevLesson,
    currentLessonDisplay,
    saveVideoProgress,
  } = useKelas(id)

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [playbackToken, setPlaybackToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [hasShownCompletion, setHasShownCompletion] = useState(false)
  // Debounced progress save - every 5 seconds (MUST be before early returns)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedSaveProgress = useCallback(
    (lessonId: string, currentTime: number) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        saveVideoProgress(lessonId, currentTime)
      }, 5000)
    },
    [saveVideoProgress],
  )

  // Cleanup debounced function on unmount (MUST be before early returns)
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  // Fetch playback token for secured video
  const fetchPlaybackToken = useCallback(
    async (lessonId: string) => {
      try {
        setTokenLoading(true)

        // Get auth token
        const authToken = await getToken()
        if (!authToken) {
          throw new Error('Not authenticated')
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || '/api'}/kelas/lessons/${lessonId}/playback-token`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        )

        if (!response.ok) throw new Error('Failed to fetch playback token')

        const data = await response.json()
        setPlaybackToken(data.token)

        // Auto-refresh token before expiry (only if expiresIn is provided)
        if (data.expiresIn && data.expiresIn > 0) {
          const refreshTime = data.expiresIn * 0.9 * 1000
          setTimeout(() => {
            fetchPlaybackToken(lessonId)
          }, refreshTime)
        }
      } catch (error) {
        console.error('Error fetching playback token:', error)
        setPlaybackToken(null)
      } finally {
        setTokenLoading(false)
      }
    },
    [getToken],
  )

  // Fetch token when active lesson changes
  useEffect(() => {
    if (activeLesson?.id && activeLesson.muxPlaybackId) {
      fetchPlaybackToken(activeLesson.id)
    } else {
      setPlaybackToken(null)
    }
  }, [activeLesson?.id, activeLesson?.muxPlaybackId, fetchPlaybackToken])

  // Check for course completion and show modal
  useEffect(() => {
    if (!selectedKelas || hasShownCompletion) return

    // Debug logging

    // Check if course is completed (100%)
    if (selectedKelas.progress === 100) {
      // Use sessionStorage to track if modal was shown in this session
      const modalKey = `completion_modal_shown_${selectedKelas.id}`
      const alreadyShown = sessionStorage.getItem(modalKey)


      if (!alreadyShown) {
        // Small delay to let the UI update
        const timer = setTimeout(() => {
          setShowCompletionModal(true)
          setHasShownCompletion(true)
          sessionStorage.setItem(modalKey, 'true')
        }, 500)
        return () => clearTimeout(timer)
      } else {
      }
    }
  }, [selectedKelas?.progress, selectedKelas?.id, hasShownCompletion])

  if (loading) {
    return <Loading fullPage />
  }

  if (!selectedKelas || !activeLesson) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <Icon icon="solar:book-minimalistic-linear" className="text-gray-400" height={40} />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-dark mb-2">Kelas tidak ditemukan</h3>
          <p className="text-sm text-bodytext mb-4">Kelas yang Anda cari tidak tersedia.</p>
          <Button onClick={() => navigate('../kelas')} variant="outline">
            <Icon icon="solar:arrow-left-outline" className="mr-2" height={16} />
            Kembali ke Daftar Kelas
          </Button>
        </div>
      </div>
    )
  }

  const { chapter: currentChapterNum, totalChapters } = currentLessonDisplay()

  const handleCheckboxChange = () => {
    if (!activeLesson) return

    // Toggle: if completed, reset to 'belum-mulai'; if not completed, mark 'selesai'
    const newStatus = activeLesson.status === 'selesai' ? 'belum-mulai' : 'selesai'

    markLessonComplete(activeLesson.id, newStatus)
  }

  // Handle video time updates
  const handleTimeUpdate = (e: any) => {
    if (!activeLesson || activeLesson.status === 'selesai') return

    const currentTime = e.target.currentTime
    const duration = e.target.duration

    if (!duration || isNaN(duration)) return

    // Save progress (debounced)
    debouncedSaveProgress(activeLesson.id, currentTime)

    // Check for auto-completion at 90% threshold
    const watchedPercentage = (currentTime / duration) * 100
    if (watchedPercentage >= 90) {
      markLessonComplete(activeLesson.id, 'selesai')
    }
  }

  // Resume from saved position when video loads
  const handleLoadedMetadata = (e: any) => {
    if (!activeLesson) return

    // Only resume if not completed and has saved progress
    if (activeLesson.status !== 'selesai' && activeLesson.videoProgress) {
      e.target.currentTime = activeLesson.videoProgress
    }
  }

  // Auto-complete when video ends naturally
  const handleVideoEnded = () => {
    if (!activeLesson || activeLesson.status === 'selesai') return
    markLessonComplete(activeLesson.id, 'selesai')
  }

  return (
    <>
      {/* Course Completion Modal */}
      <CourseCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        courseName={selectedKelas?.title || ''}
      />

      {/* Main Course Content */}
      <div className="flex flex-col lg:h-[calc(100vh-100px)] h-auto gap-4 overflow-hidden -mx-5 md:-mx-6 lg:-mx-8 -my-8 px-5 md:px-6 lg:px-8 pb-10 lg:pb-0 pt-4 lg:pt-8">
        {/* Compact Course Header - Reduced padding and spacing */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 rounded-lg hover:bg-gray-100 shrink-0"
              onClick={() => navigate('../kelas')}
              title="Kembali ke Daftar Kelas"
            >
              <Icon icon="solar:arrow-left-outline" height={20} className="text-gray-600" />
            </Button>
            <div className="w-10 h-10 rounded-lg bg-[var(--color-gold-light)] flex items-center justify-center shrink-0">
              <Icon icon="solar:bookmark-linear" className="text-[var(--color-gold-hover)]" height={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-dark leading-tight">{selectedKelas.title}</h1>
              <p className="text-xs text-bodytext line-clamp-1">{selectedKelas.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 border border-ld rounded-lg flex items-center gap-2 text-xs text-bodytext bg-white">
              <Icon icon="solar:documents-minimalistic-linear" height={16} />
              <span>
                Chapter : {selectedKelas.completedChapters}/{selectedKelas.totalChapters}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Left Side: Video & Content */}
          {/* Mobile: Full height, Visible overflow. Desktop: Full height, Scrollable. */}
          <div
            className={`${isSidebarOpen ? 'lg:col-span-8' : 'lg:col-span-12'} col-span-12 transition-all duration-300 h-auto lg:h-full flex flex-col lg:overflow-y-auto overflow-visible custom-scrollbar`}
          >
            {/* Video Player Container */}
            <div className="relative w-full bg-black shadow-sm shrink-0 rounded-xl overflow-hidden aspect-video">
              {tokenLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-white">Loading secure video...</div>
                </div>
              ) : activeLesson.muxPlaybackId && playbackToken ? (
                <LazyMuxPlayer
                  playbackId={activeLesson.muxPlaybackId}
                  tokens={{ playback: playbackToken }}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleVideoEnded}
                  className="w-full h-full"
                  style={{
                    '--controls': 'auto',
                    '--media-object-fit': 'contain',
                    '--center-controls': 'none',
                    aspectRatio: '16/9',
                    width: '100%',
                    height: '100%',
                  } as React.CSSProperties}
                  streamType="on-demand"
                  preload="metadata"
                  muted={false}
                  volume={1}
                />
              ) : activeLesson.videoUrl && isYouTubeUrl(activeLesson.videoUrl) ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${extractYouTubeId(activeLesson.videoUrl)}`}
                  title={activeLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : activeLesson.videoUrl && isGoogleDriveUrl(activeLesson.videoUrl) ? (
                <div className="google-drive-player-wrapper w-full h-full">
                  <iframe
                    className="w-full h-full"
                    src={getGoogleDriveEmbedUrl(extractGoogleDriveId(activeLesson.videoUrl)!)}
                    title={activeLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white">
                  <Icon
                    icon="solar:videocamera-slash-linear"
                    height={48}
                    className="text-gray-500 mb-2"
                  />
                  <span className="text-sm text-gray-400">Video belum tersedia</span>
                </div>
              )}
            </div>

            {/* Info Section - No internal scroll, let parent handle it */}
            <div className="space-y-3 py-3 pr-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-gray-100 text-dark hover:bg-gray-100 font-normal rounded-md px-3">
                  {activeLesson.title} - {activeLesson.duration}
                </Badge>

                {/* Explicitly show 'Done' status if completed */}
                {activeLesson.status === 'selesai' && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-medium rounded-md px-3 flex items-center gap-1">
                    <Icon icon="solar:check-circle-bold" height={14} />
                    Selesai
                  </Badge>
                )}
              </div>

              {/* Control Bar: Status (Left) | Navigation (Right) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1 border-t border-gray-100 mt-2">
                {/* Left: Status & Chapter Counter */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={activeLesson.status === 'selesai'}
                        onChange={handleCheckboxChange}
                      />
                      <div className="w-5 h-5 border-2 border-[var(--color-gold)] rounded flex items-center justify-center peer-checked:bg-[var(--color-gold)] peer-checked:border-[var(--color-gold)] transition-all group-hover:border-[var(--color-gold)]/80">
                        <Icon
                          icon="solar:check-read-linear"
                          className="text-white opacity-0 peer-checked:opacity-100"
                          height={14}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-sm ${activeLesson.status === 'selesai' ? 'text-dark font-medium' : 'text-bodytext'}`}
                    >
                      {activeLesson.status === 'selesai'
                        ? 'Tandai belum selesai'
                        : 'Tandai sebagai selesai'}
                    </span>
                  </label>
                  <span className="text-bodytext mx-1 hidden sm:inline">|</span>
                  <span className="text-sm font-medium text-dark">
                    Chapter {currentChapterNum} dari {totalChapters}
                  </span>
                </div>

                {/* Right: Navigation Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none border-primary text-primary hover:bg-primary/5 h-9 px-3"
                    onClick={goToPrevLesson}
                  >
                    <Icon icon="solar:arrow-left-outline" className="mr-1" height={16} />
                    Sebelumnya
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 sm:flex-none bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white h-9 px-3"
                    onClick={goToNextLesson}
                  >
                    Selanjutnya
                    <Icon icon="solar:arrow-right-outline" className="ml-1" height={16} />
                  </Button>
                </div>
              </div>

              {/* Progress Bar (Moved to bottom) */}
              <div className="mt-4 bg-[var(--color-gold)] rounded-md p-3 border border-[var(--color-gold)]">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-xs text-white">Progress Kelas</h3>
                  <span className="font-bold text-xs text-white">{selectedKelas.progress}%</span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-1.5">
                  <div
                    className="bg-white h-1.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${selectedKelas.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Chapter List */}
          {isSidebarOpen && (
            <div className="lg:col-span-4 col-span-12 lg:h-full h-[500px] min-h-0">
              <CardBox className="h-full border-none shadow-sm flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-base font-bold text-dark">Daftar Materi</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                    onClick={() => setIsSidebarOpen(false)}
                    title="Tutup Sidebar"
                  >
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      height={18}
                      className="text-gray-500"
                    />
                  </Button>
                </div>

                {/* Progress Bar in Sidebar */}

                <div className="space-y-4 overflow-y-auto pr-1 flex-1 custom-scrollbar min-h-0">
                  {selectedKelas.chapters.map((chapter: any, index: number) => (
                    <div key={chapter.id}>
                      {/* Chapter Header */}
                      <div className="flex flex-col items-start mb-2 sticky top-0 bg-white z-10 py-2 border-b border-gray-50">
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-0.5">
                          Chapter {index + 1}
                        </span>
                        <span className="text-sm font-bold text-dark leading-tight">
                          {chapter.title.includes(':')
                            ? chapter.title.split(':')[1].trim()
                            : chapter.title}
                        </span>
                      </div>

                      {/* Lessons List */}
                      <div className="space-y-2">
                        {chapter.lessons.map((lesson: any, idx: number) => (
                          <CourseLessonItem
                            key={`${chapter.id}-${lesson.id}`}
                            lesson={lesson}
                            idx={idx}
                            totalLessons={chapter.lessons.length}
                            isActive={activeLesson.id === lesson.id}
                            onClick={() => setActiveLesson(lesson)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBox>
            </div>
          )}

          {/* Floating Sidebar Toggle Button (when closed) */}
          {!isSidebarOpen && (
            <div className="fixed right-6 bottom-6 z-50">
              <Button
                className="bg-dark text-white rounded-full h-12 w-12 shadow-lg hover:scale-110 transition-transform p-0 flex items-center justify-center"
                onClick={() => setIsSidebarOpen(true)}
                title="Buka Daftar Materi"
              >
                <Icon icon="solar:notebook-minimalistic-bold" height={24} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Kelas
