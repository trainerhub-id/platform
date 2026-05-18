import { CheckCircle, Mail } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'
import { Button } from 'src/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog'
import { useUser } from 'src/lib/better-auth'

interface SetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SetPasswordDialog({ open, onOpenChange }: SetPasswordDialogProps) {
  const { user } = useUser()

  async function handleClose() {
    // Clear the needsPasswordSetup flag so popup won't show again
    if (user) {
      try {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            needsPasswordSetup: false,
          },
        })
      } catch (error) {
        console.error('Failed to update user metadata:', error)
      }
    }

    toast.success('Selamat datang! 🎉')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Pembayaran Berhasil! 🎉</DialogTitle>
              <DialogDescription className="mt-1">Akun Anda sudah aktif</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">📧 Cek Email Anda!</p>
                <p className="text-xs text-green-700 mt-1">
                  Kami telah mengirim <strong>password sementara</strong> dan{' '}
                  <strong>magic link</strong> untuk ganti password ke:
                </p>
                <p className="text-sm font-mono text-blue-900 mt-2">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm bg-white border rounded-lg p-3">
            <p className="font-medium text-gray-900">✅ Yang Anda dapat:</p>
            <ul className="space-y-1 text-gray-700 ml-4">
              <li>• Password untuk login berikutnya</li>
              <li>• Magic link untuk ganti password (24 jam)</li>
              <li>• Full access ke semua materi kursus</li>
              <li>• Sertifikat setelah selesai training</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900">
              💡 <strong>Tips:</strong> Simpan password atau segera ganti via magic link untuk
              keamanan.
            </p>
          </div>
        </div>

        <Button onClick={handleClose} className="w-full" size="lg">
          Mulai Belajar Sekarang
        </Button>
      </DialogContent>
    </Dialog>
  )
}
