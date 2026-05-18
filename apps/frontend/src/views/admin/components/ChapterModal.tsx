import React, { useEffect, useState } from 'react'
import { ImageUpload } from 'src/components/shared/ImageUpload'
import { Button } from 'src/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { ButtonLoading } from 'src/components/ui/loading'
import { Textarea } from 'src/components/ui/textarea'

interface ChapterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (data: { title: string; description?: string; thumbnailUrl?: string }) => void
  initialData?: { title: string; description?: string; thumbnailUrl?: string }
  loading?: boolean
}

export const ChapterModal: React.FC<ChapterModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  initialData,
  loading = false,
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title || '')
      setDescription(initialData?.description || '')
      setThumbnailUrl(initialData?.thumbnailUrl || '')
    }
  }, [open, initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSuccess({
      title,
      description: description.trim() || undefined,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Chapter' : 'Tambah Chapter'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="chapter-title">Judul Chapter *</Label>
            <Input
              id="chapter-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Bab 1 - Pengenalan React"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chapter-description">Deskripsi</Label>
            <Textarea
              id="chapter-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat tentang chapter ini..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <ImageUpload
              label="Thumbnail Chapter"
              value={thumbnailUrl}
              onChange={setThumbnailUrl}
              placeholder="https://example.com/chapter-thumbnail.jpg"
              helpText="Gambar thumbnail untuk chapter (opsional). Ukuran maksimal 5MB."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? <ButtonLoading /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
