import { Icon } from '@iconify/react'
import React from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader } from '../ui/dialog'

interface CourseCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  courseName: string
}

export const CourseCompletionModal: React.FC<CourseCompletionModalProps> = ({
  isOpen,
  onClose,
  courseName,
}) => {
  const navigate = useNavigate()

  const handleViewCertificate = () => {
    navigate('/user/sertifikat')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center space-y-4">
          {/* Trophy Icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto shadow-lg">
            <Icon icon="solar:cup-star-bold" className="text-white" height={48} />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-dark">🎉 Selamat! 🎉</h2>
            <p className="text-lg font-semibold text-primary">Kamu Berhasil Menyelesaikan Kelas!</p>
          </div>

          {/* Course Name */}
          <div className="bg-gray-50 rounded-lg p-4 w-full">
            <p className="text-sm text-bodytext mb-1">Kelas yang diselesaikan:</p>
            <p className="font-bold text-dark">{courseName}</p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-success">
              <Icon icon="solar:check-circle-bold" height={20} />
              <p className="text-sm font-medium">Sertifikat telah dibuat otomatis</p>
            </div>
            <p className="text-sm text-bodytext">
              Sertifikat kamu sudah siap dan bisa diunduh kapan saja. Tunjukkan pencapaian ini pada
              dunia!
            </p>
          </div>
        </DialogHeader>

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={handleViewCertificate}
            className="w-full bg-primary hover:bg-primary/90 text-white h-11"
          >
            <Icon icon="solar:diploma-verified-bold" className="mr-2" height={20} />
            Lihat Sertifikat
          </Button>
          <Button onClick={onClose} variant="outline" className="w-full h-11">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
