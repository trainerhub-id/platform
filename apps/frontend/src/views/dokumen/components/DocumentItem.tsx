import { Icon } from '@iconify/react'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'src/components/ui/alert-dialog'
import { Button } from 'src/components/ui/button'
import { DocumentStatus, DocumentType, useDokumen } from '../hooks/useDokumen'
import { UploadDocumentModal } from './UploadDocumentModal'

interface DocumentItemProps {
  type: DocumentType
  status?: DocumentStatus
  onUpdate: () => void
}

export const DocumentItem = ({ type, status, onUpdate }: DocumentItemProps) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { deleteDocument } = useDokumen()

  const handleDelete = async () => {
    if (!status?.dokumenId) return

    setDeleting(true)
    try {
      await deleteDocument(status.dokumenId)
      onUpdate()
      setIsDeleteOpen(false)
    } catch (error) {
      console.error('Delete failed', error)
      alert('Gagal menghapus dokumen. Silakan coba lagi.')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = () => {
    if (!status) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Belum Diunggah
        </span>
      )
    }

    switch (status.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Icon icon="solar:clock-circle-line-duotone" className="mr-1" />
            Menunggu Verifikasi
          </span>
        )
      case 'verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Icon icon="solar:verified-check-line-duotone" className="mr-1" />
            Terverifikasi
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Icon icon="solar:close-circle-line-duotone" className="mr-1" />
            Ditolak
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-primary/50 transition-colors gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-base font-semibold text-gray-900">{type.nama}</h4>
          {type.isRequired && <span className="text-xs font-medium text-red-500">*wajib</span>}
        </div>
        <p className="text-sm text-gray-500 line-clamp-2">{type.deskripsi}</p>

        {status?.catatan && status.status === 'rejected' && (
          <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
            <strong>Catatan Admin:</strong> {status.catatan}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 min-w-[140px]">
        {getStatusBadge()}

        <div className="flex gap-2 mt-1">
          {status?.fileUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(status.fileUrl, '_blank')}
            >
              <Icon icon="solar:eye-line-duotone" className="mr-1" />
              Lihat
            </Button>
          )}

          {status && status.status !== 'verified' && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(true)}>
                <Icon icon="solar:refresh-line-duotone" className="mr-1" />
                Ganti
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Icon icon="solar:trash-bin-trash-line-duotone" className="mr-1" />
                Hapus
              </Button>
            </>
          )}

          {!status && (
            <Button size="sm" onClick={() => setIsUploadOpen(true)}>
              <Icon icon="solar:upload-minimalistic-line-duotone" className="mr-1" />
              Unggah
            </Button>
          )}
        </div>
      </div>

      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        jenisDokumenId={type.id}
        jenisDokumenName={type.nama}
        onSuccess={onUpdate}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus dokumen "{type.nama}"? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
