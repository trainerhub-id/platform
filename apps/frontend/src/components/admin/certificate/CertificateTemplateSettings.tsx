import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, FileText, RotateCcw, Upload } from 'lucide-react'
import React, { useState } from 'react'
import { certificateTemplateApi } from 'src/api/certificate-template.api'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { toast } from 'src/hooks/use-toast'
import { PreviewTemplateModal } from './PreviewTemplateModal'
import { UploadTemplateModal } from './UploadTemplateModal'

export const CertificateTemplateSettings: React.FC = () => {
  const queryClient = useQueryClient()
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

  const {
    data: templateInfo,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['activeTemplate'],
    queryFn: certificateTemplateApi.getActiveTemplate,
    retry: 3,
    retryDelay: 1000,
  })

  const resetMutation = useMutation({
    mutationFn: certificateTemplateApi.resetToDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTemplate'] })
      toast({
        title: 'Berhasil',
        description: 'Template dikembalikan ke default',
      })
    },
    onError: () => {
      toast({
        title: 'Gagal',
        description: 'Gagal mereset template',
        variant: 'destructive',
      })
    },
  })

  const handleDownload = async () => {
    if (!templateInfo?.id) return

    try {
      const blob = await certificateTemplateApi.downloadTemplate(templateInfo.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${templateInfo.name}.html`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'Gagal mendownload template',
        variant: 'destructive',
      })
    }
  }

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['activeTemplate'] })
    toast({
      title: 'Berhasil',
      description: 'Template berhasil diupload',
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Template Sertifikat</CardTitle>
          <CardDescription>Kelola template HTML untuk sertifikat peserta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-500">
              Error: {error instanceof Error ? error.message : 'Failed to load template info'}
              <br />
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['activeTemplate'] })}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : templateInfo?.hasCustomTemplate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{templateInfo.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Diupload pada {new Date(templateInfo.createdAt!).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setUploadModalOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Template Baru
                </Button>
                <Button
                  variant="outline"
                  onClick={() => resetMutation.mutate()}
                  disabled={resetMutation.isPending}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset ke Default
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Saat ini menggunakan template default. Upload template custom untuk mengubah
                tampilan sertifikat.
              </p>
              <Button onClick={() => setUploadModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Template
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <UploadTemplateModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      <PreviewTemplateModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        htmlContent={previewHtml}
      />
    </>
  )
}
