import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import api from 'src/api/axios'
import CardBox from 'src/components/shared/CardBox'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { ButtonLoading, Loading } from 'src/components/ui/loading'
import { Textarea } from 'src/components/ui/textarea'
import { ChapterModal } from './components/ChapterModal'
import { LessonModal } from './components/LessonModal'

const EditKelas = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditMode)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    isActive: 1,
  })
  const [chapters, setChapters] = useState<any[]>([])

  // Modal States
  const [chapterModalOpen, setChapterModalOpen] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<any>(null) // For editing or strictly for adding lesson to a chapter
  const [isEditingChapter, setIsEditingChapter] = useState(false)

  const [lessonModalOpen, setLessonModalOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<any>(null) // For editing
  const [targetChapterId, setTargetChapterId] = useState<string | null>(null) // Which chapter to add lesson to

  useEffect(() => {
    if (isEditMode) {
      fetchCourse()
    }
  }, [id])

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/kelas/${id}`)
      const course = response.data
      setFormData({
        title: course.title,
        description: course.description || '',
        imageUrl: course.imageUrl || '',
        isActive: course.isActive,
      })
      setChapters(course.chapters || [])
    } catch (error) {
      console.error('Error fetching course:', error)
      alert('Gagal memuat data kelas')
      navigate('/admin/manage-kelas')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEditMode) {
        await api.patch(`/kelas/${id}`, formData)
      } else {
        await api.post('/kelas', formData)
      }
      navigate('/admin/manage-kelas')
    } catch (error: any) {
      console.error('Error saving course:', error)
      alert(error.response?.data?.message || 'Gagal menyimpan kelas')
    } finally {
      setLoading(false)
    }
  }

  // --- Chapter Management ---
  const openAddChapterModal = () => {
    if (!isEditMode) {
      alert('Harap simpan kelas terlebih dahulu sebelum menambah chapter.')
      return
    }
    setSelectedChapter(null)
    setIsEditingChapter(false)
    setChapterModalOpen(true)
  }

  const openEditChapterModal = (chapter: any) => {
    setSelectedChapter(chapter)
    setIsEditingChapter(true)
    setChapterModalOpen(true)
  }

  const handleSaveChapter = async (data: {
    title: string
    description?: string
    thumbnailUrl?: string
  }) => {
    setLoading(true)
    try {
      if (isEditingChapter && selectedChapter) {
        await api.patch(`/kelas/chapters/${selectedChapter.id}`, data)
      } else {
        await api.post('/kelas/chapters', {
          courseId: id,
          ...data,
          orderIndex: chapters.length + 1,
        })
      }
      setChapterModalOpen(false)
      fetchCourse()
    } catch (error) {
      console.error('Error saving chapter:', error)
      alert('Gagal menyimpan chapter')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Hapus chapter ini beserta isinya?')) return
    try {
      await api.delete(`/kelas/chapters/${chapterId}`)
      fetchCourse()
    } catch (error) {
      alert('Gagal menghapus chapter')
    }
  }

  // --- Lesson Management ---
  const openAddLessonModal = (chapterId: string) => {
    setSelectedLesson(null)
    setTargetChapterId(chapterId)
    setLessonModalOpen(true)
  }

  const openEditLessonModal = (lesson: any, chapterId: string) => {
    setSelectedLesson(lesson)
    setTargetChapterId(chapterId) // Though we don't strictly need this for edit, it keeps context
    setLessonModalOpen(true)
  }

  const handleSaveLesson = async (data: any) => {
    setLoading(true)
    try {
      if (selectedLesson) {
        // Edit
        await api.patch(`/kelas/lessons/${selectedLesson.id}`, data)
      } else {
        // Create
        if (!targetChapterId) return

        const chapter = chapters.find((c) => c.id === targetChapterId)
        const currentLessons = chapter?.lessons?.length || 0

        await api.post('/kelas/lessons', {
          chapterId: targetChapterId,
          ...data,
          orderIndex: currentLessons + 1,
        })
      }
      setLessonModalOpen(false)
      fetchCourse()
    } catch (error) {
      console.error('Error saving lesson:', error)
      alert('Gagal menyimpan pelajaran')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Hapus pelajaran ini?')) return
    try {
      await api.delete(`/kelas/lessons/${lessonId}`)
      fetchCourse()
    } catch (error) {
      alert('Gagal menghapus pelajaran')
    }
  }

  if (initialLoading) {
    return <Loading fullPage text="Memuat data kelas..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/admin/manage-kelas')}>
          <Icon icon="solar:arrow-left-outline" height={20} />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-dark">
            {isEditMode ? 'Edit Kelas' : 'Buat Kelas Baru'}
          </h2>
        </div>
      </div>

      <CardBox>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <Label htmlFor="title">Judul Kelas</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Contoh: React JS Fundamentals"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Deskripsi singkat tentang kelas ini..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="imageUrl">URL Gambar Thumbnail</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/manage-kelas')}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <ButtonLoading /> Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </div>
        </form>
      </CardBox>

      {isEditMode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-dark">Daftar Chapter</h3>
            <Button onClick={openAddChapterModal} variant="outline" className="border-dashed">
              <Icon icon="solar:add-circle-linear" className="mr-2" />
              Tambah Chapter
            </Button>
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
              Belum ada chapter.
            </div>
          ) : (
            <div className="space-y-4">
              {chapters.map((chapter) => (
                <CardBox key={chapter.id} className="p-0 border border-gray-100 overflow-hidden">
                  {/* Chapter Header with Thumbnail */}
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                    {/* Thumbnail */}
                    {chapter.thumbnailUrl ? (
                      <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 border-white shadow-sm">
                        <img
                          src={chapter.thumbnailUrl}
                          alt={chapter.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/96x96/e0e7ff/4f46e5?text=Ch'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-24 h-24 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center border-2 border-white shadow-sm">
                        <span className="text-2xl font-bold text-blue-600">
                          Ch. {chapter.orderIndex}
                        </span>
                      </div>
                    )}

                    {/* Chapter Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-white text-blue-600 text-xs font-semibold px-2 py-1 rounded shadow-sm">
                              Ch. {chapter.orderIndex}
                            </span>
                            <h4 className="font-bold text-lg text-gray-800">{chapter.title}</h4>
                          </div>
                          {chapter.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {chapter.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 hover:bg-white/50"
                            onClick={() => openEditChapterModal(chapter)}
                          >
                            <Icon icon="solar:pen-linear" height={18} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600 hover:bg-white/50"
                            onClick={() => handleDeleteChapter(chapter.id)}
                          >
                            <Icon icon="solar:trash-bin-trash-linear" height={18} />
                          </Button>
                        </div>
                      </div>

                      {/* Chapter Stats */}
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Icon icon="solar:play-circle-linear" height={14} />
                          {chapter.lessons?.length || 0} Pelajaran
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lessons */}
                  <div className="p-4 bg-white">
                    <div className="space-y-2">
                      {chapter.lessons?.map((lesson: any) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer"
                          onClick={() => openEditLessonModal(lesson, chapter.id)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Icon
                                icon="solar:play-circle-bold"
                                className="text-blue-600"
                                height={20}
                              />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-800 truncate">
                                {lesson.title}
                              </span>
                              {lesson.duration && (
                                <span className="text-xs text-gray-500">{lesson.duration}</span>
                              )}
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 flex-shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditLessonModal(lesson, chapter.id)
                              }}
                            >
                              <Icon icon="solar:pen-linear" height={16} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteLesson(lesson.id)
                              }}
                            >
                              <Icon icon="solar:trash-bin-trash-linear" height={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-center mt-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => openAddLessonModal(chapter.id)}
                      >
                        <Icon icon="solar:add-circle-linear" className="mr-2" height={16} />
                        Tambah Pelajaran
                      </Button>
                    </div>
                  </div>
                </CardBox>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ChapterModal
        open={chapterModalOpen}
        onOpenChange={setChapterModalOpen}
        onSuccess={handleSaveChapter}
        initialData={
          isEditingChapter && selectedChapter
            ? {
                title: selectedChapter.title,
                description: selectedChapter.description,
                thumbnailUrl: selectedChapter.thumbnailUrl,
              }
            : undefined
        }
        loading={loading}
      />

      <LessonModal
        open={lessonModalOpen}
        onOpenChange={setLessonModalOpen}
        onSuccess={handleSaveLesson}
        initialData={selectedLesson}
        loading={loading}
      />
    </div>
  )
}

export default EditKelas
