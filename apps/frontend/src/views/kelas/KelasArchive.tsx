import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import api from 'src/api/axios'
import CardBox from 'src/components/shared/CardBox'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Loading } from 'src/components/ui/loading'

interface Course {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  totalChapters: number
  totalLessons: number
  progress?: number
  completedLessons?: number
  hasAccess?: boolean
}

const KelasArchive = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await api.get('/kelas')
      setCourses(response.data)
    } catch (err) {
      console.error('Error fetching courses:', err)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleCourseClick = (courseId: string, hasAccess: boolean) => {
    if (!hasAccess) {
      return // Do nothing if no access
    }
    navigate(`kelas/${courseId}`)
  }

  if (loading) {
    return <Loading fullPage />
  }

  return (
    <>
      {/* Course Grid */}
      {courses.length === 0 ? (
        <CardBox className="p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Icon icon="solar:book-minimalistic-linear" className="text-gray-400" height={40} />
            </div>
            <h3 className="text-lg font-semibold text-dark mb-2">Belum Ada Kelas</h3>
            <p className="text-sm text-bodytext">
              Saat ini belum ada kelas yang tersedia untuk Anda.
            </p>
          </div>
        </CardBox>
      ) : (
        <div className="grid grid-cols-12 gap-5">
          {courses.map((course) => (
            <div key={course.id} className="lg:col-span-4 md:col-span-6 col-span-12">
              <CardBox
                className={`p-0 overflow-hidden border rounded-2xl border-gray-200 bg-white transition-all ${
                  course.hasAccess === false
                    ? 'opacity-60 cursor-not-allowed'
                    : 'cursor-pointer hover:border-[#B58E36] hover:ring-1 hover:ring-[#B58E36]/20'
                }`}
                onClick={() => handleCourseClick(course.id, course.hasAccess !== false)}
              >
                <div>
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-ld flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <h5 className="font-bold text-[#AA8D55] text-base">{course.title}</h5>
                      {course.hasAccess === false && (
                        <Icon icon="solar:lock-bold" className="text-gray-400" height={16} />
                      )}
                    </div>
                    {course.progress !== undefined &&
                      course.progress > 0 &&
                      course.hasAccess !== false && (
                        <Badge className="bg-[#E6D6BC] text-[#8D6E33] hover:bg-[#E6D6BC] font-medium text-xs px-2 py-0.5">
                          {course.progress}%
                        </Badge>
                      )}
                  </div>

                  {/* Course Image */}
                  <div className="px-0 relative">
                    {course.imageUrl ? (
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-32 bg-gradient-to-br from-[#F8F4ED] to-[#EDE5D8] flex items-center justify-center ${course.imageUrl ? 'hidden' : ''}`}
                    >
                      <Icon
                        icon="solar:book-minimalistic-bold"
                        className="text-[#C4B596]"
                        height={44}
                      />
                    </div>
                    {/* Lock overlay for courses without access */}
                    {course.hasAccess === false && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="bg-white rounded-full p-3">
                          <Icon icon="solar:lock-bold" className="text-gray-600" height={32} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="px-4 py-3">
                    <p className="text-sm text-bodytext leading-relaxed mb-3 line-clamp-2">
                      {course.description}
                    </p>

                    <div className="border-t border-ld pt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-bodytext font-medium text-[11px]">
                        <Icon icon="solar:documents-minimalistic-linear" height={16} />
                        <span>{course.totalChapters}</span>
                        <span className="mx-1">•</span>
                        <Icon icon="solar:play-circle-linear" height={16} />
                        <span>{course.totalLessons}</span>
                      </div>
                      {course.hasAccess === false ? (
                        <Badge
                          variant="outline"
                          className="text-gray-500 border-gray-300 px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                        >
                          Terkunci
                        </Badge>
                      ) : (
                        <Button className="bg-[#AA8D55] hover:bg-[#AA8D55]/90 text-white rounded-xl px-4 py-1.5 h-auto text-[10px] font-bold shadow-none transition-colors border-none outline-none uppercase tracking-wider">
                          {course.progress && course.progress > 0 ? 'Lanjutkan' : 'Mulai'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardBox>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default KelasArchive
