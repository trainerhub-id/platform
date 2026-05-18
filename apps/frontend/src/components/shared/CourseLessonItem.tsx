import { Icon } from '@iconify/react'
import { Badge } from '../ui/badge'

interface Lesson {
  id: string
  title: string
  duration: string
  status: string
}

interface CourseLessonItemProps {
  lesson: Lesson
  idx: number
  totalLessons: number
  isActive?: boolean
  onClick?: () => void
}

const CourseLessonItem = ({
  lesson,
  idx,
  totalLessons,
  isActive,
  onClick,
}: CourseLessonItemProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'selesai':
        return (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 shadow-none font-bold text-[10px] px-2 py-0.5">
            Selesai
          </Badge>
        )
      case 'sedang-diproses':
        return (
          <Badge className="bg-[#FFF4E5] text-warning hover:bg-[#FFF4E5] shadow-none font-bold text-[10px] px-2 py-0.5">
            Sedang dipelajari
          </Badge>
        )
      case 'belum-mulai':
        return (
          <Badge className="bg-gray-100 text-bodytext hover:bg-gray-200 shadow-none font-bold text-[10px] px-2 py-0.5">
            Belum mulai
          </Badge>
        )
      default:
        return null
    }
  }

  const getLessonIcon = (status: string) => {
    if (status === 'selesai') {
      return (
        <div className="w-9 h-9 rounded-lg bg-[#4F75FF] flex items-center justify-center flex-shrink-0">
          <Icon icon="solar:check-read-linear" className="text-white" height={20} />
        </div>
      )
    }
    if (status === 'sedang-diproses') {
      return (
        <div className="w-9 h-9 rounded-lg bg-[#EBF3FF] flex items-center justify-center flex-shrink-0">
          <Icon icon="solar:play-bold" className="text-primary" height={18} />
        </div>
      )
    }
    return (
      <div className="w-9 h-9 rounded-lg border border-ld flex items-center justify-center flex-shrink-0">
        <Icon icon="solar:play-outline" className="text-bodytext" height={18} />
      </div>
    )
  }

  return (
    <div className="group">
      <div
        className={`flex items-start gap-3 p-2 rounded-xl transition-all duration-200 cursor-pointer border ${
          isActive
            ? 'bg-[#EFF4FF] border-[#4F75FF] shadow-sm'
            : 'hover:bg-gray-50 bg-white border-transparent'
        }`}
        onClick={onClick}
      >
        {getLessonIcon(lesson.status)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4
              className={`text-sm font-semibold truncate pr-2 ${isActive ? 'text-[#4F75FF]' : 'text-dark'}`}
            >
              {lesson.title}
            </h4>
            {getStatusBadge(lesson.status)}
          </div>
          <p className="text-xs text-bodytext">{lesson.duration}</p>
        </div>
      </div>
      {idx < totalLessons - 1 && (
        <div className="border-b border-dashed border-gray-200 my-2 mx-4"></div>
      )}
    </div>
  )
}

export default CourseLessonItem
