import { Icon } from '@iconify/react'
import React, { useRef, useState } from 'react'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs'

interface ImageUploadProps {
  label?: string
  value?: string
  onChange: (value: string) => void
  onFileSelect?: (file: File) => void
  placeholder?: string
  helpText?: string
  showPreview?: boolean
}

/**
 * ImageUpload Component
 *
 * Supports two modes:
 * 1. URL Input - User can paste an image URL directly
 * 2. File Upload - User can upload an image file
 *
 * Usage:
 * ```tsx
 * <ImageUpload
 *   label="Thumbnail"
 *   value={thumbnailUrl}
 *   onChange={(url) => setThumbnailUrl(url)}
 *   onFileSelect={(file) => handleFileUpload(file)}
 * />
 * ```
 */
export const ImageUpload: React.FC<ImageUploadProps> = ({
  label = 'Image',
  value = '',
  onChange,
  onFileSelect,
  placeholder = 'https://example.com/image.jpg',
  helpText = 'Enter an image URL or upload a file. Only *.png, *.jpg and *.jpeg files are accepted.',
  showPreview = true,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(value)
  const [activeTab, setActiveTab] = useState<string>('url')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    onChange(url)
    setPreviewUrl(url)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (PNG or JPEG)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Notify parent component
    if (onFileSelect) {
      onFileSelect(file)
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl('')
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      {label && <Label>{label}</Label>}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-3 mt-3">
          <Input type="url" value={value} onChange={handleUrlChange} placeholder={placeholder} />
        </TabsContent>

        <TabsContent value="upload" className="space-y-3 mt-3">
          <div
            onClick={triggerFileInput}
            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-md border-[1px] border-dashed border-primary bg-lightprimary hover:bg-lightprimary/80 transition-colors py-8"
          >
            <Icon icon="solar:cloud-upload-outline" height={40} className="mb-3 text-primary" />
            <p className="mb-2 text-sm text-bodytext">
              <span className="font-medium text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-bodytext">PNG, JPG or JPEG (max. 5MB)</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />
        </TabsContent>
      </Tabs>

      {/* Image Preview */}
      {showPreview && previewUrl && (
        <div className="relative w-full rounded-md border border-gray-200 overflow-hidden">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-48 object-cover"
            onError={() => setPreviewUrl('')}
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemoveImage}
          >
            <Icon icon="solar:trash-bin-trash-bold" height={16} />
          </Button>
        </div>
      )}

      {helpText && <p className="text-xs text-bodytext">{helpText}</p>}
    </div>
  )
}
