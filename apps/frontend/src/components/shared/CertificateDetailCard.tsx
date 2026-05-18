import { Icon } from '@iconify/react'
import { useState } from 'react'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import CardBox from './CardBox'

interface CertificateDetail {
  label: string
  value: string
}

interface CertificateDetailCardProps {
  title: string
  status: string
  isReady: boolean
  isOfficial?: boolean
  details: CertificateDetail[]
  alertMessage?: string
  downloadUrl?: string
  certificateUrl?: string
}

const CertificateDetailCard = ({
  title,
  status,
  isReady,
  isOfficial,
  details,
  alertMessage,
  downloadUrl,
  certificateUrl,
}: CertificateDetailCardProps) => {
  const statusColor = isReady ? 'text-success' : 'text-warning'
  const statusBg = isReady ? 'bg-success' : 'bg-warning'
  const [copied, setCopied] = useState(false)

  const handleDownload = () => {
    if (downloadUrl && downloadUrl !== '#') {
      window.open(downloadUrl, '_blank')
    }
  }

  const handleCopyUrl = async () => {
    if (certificateUrl) {
      try {
        await navigator.clipboard.writeText(certificateUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  return (
    <CardBox className="px-6 py-6 ring-0 shadow-[0px_0px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-lg text-dark">{title}</h3>
          {isOfficial && (
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary font-bold px-2 py-0.5 text-[10px] rounded uppercase tracking-wider">
              RESMI
            </Badge>
          )}
        </div>
        <div className={`flex items-center gap-2 ${statusColor} text-sm`}>
          <div className={`w-2 h-2 rounded-full ${statusBg}`}></div>
          <span>{status}</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 mb-6">
        <div className="col-span-12 md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-y-6">
          {details.map((detail) => (
            <div key={detail.label}>
              <p className="text-xs font-semibold text-dark mb-1">{detail.label}</p>
              <p className="text-sm text-bodytext font-medium">{detail.value}</p>
            </div>
          ))}
        </div>
        <div className="col-span-12 md:col-span-4">
          <div className="aspect-[1.58/1] rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-bodytext bg-gray-50/50">
            {isReady ? (
              <Icon icon="solar:diploma-verified-bold" className="mb-2 text-success" height={32} />
            ) : (
              <Icon icon="solar:lock-password-bold" className="mb-2 text-gray-300" height={24} />
            )}
            <span className="text-xs">{isReady ? 'Siap Diunduh' : 'Terkunci'}</span>
          </div>
        </div>
      </div>

      {isReady && certificateUrl && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200 mb-6">
          <Icon icon="solar:link-circle-linear" className="text-bodytext shrink-0" height={18} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-bodytext font-medium mb-0.5">URL Publik Sertifikat</p>
            <p className="text-xs text-dark">Klik tombol salin untuk menyalin URL lengkap</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 h-8 px-3 hover:bg-gray-200"
            onClick={handleCopyUrl}
          >
            <Icon
              icon={copied ? 'solar:check-circle-bold' : 'solar:copy-linear'}
              className={copied ? 'text-success' : 'text-bodytext'}
              height={16}
            />
            <span
              className={`ml-1.5 text-xs font-medium ${copied ? 'text-success' : 'text-bodytext'}`}
            >
              {copied ? 'Tersalin' : 'Salin'}
            </span>
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4 pt-2 border-t border-gray-100 mt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {!isReady && (
            <Alert className="bg-[#EBF3FF] border-none flex items-center gap-3 py-2 px-4 rounded-md md:w-auto w-full flex-1">
              <Icon icon="solar:info-circle-bold" className="text-primary shrink-0" height={18} />
              <AlertDescription className="text-xs text-primary">
                {alertMessage || 'Sertifikat belum tersedia.'}
              </AlertDescription>
            </Alert>
          )}

          {isReady && (
            <Alert className="bg-success/10 border-none flex items-center gap-3 py-2 px-4 rounded-md md:w-auto w-full flex-1">
              <Icon icon="solar:check-circle-bold" className="text-success shrink-0" height={18} />
              <AlertDescription className="text-xs text-success font-medium">
                {alertMessage || 'Sertifikat siap diunduh!'}
              </AlertDescription>
            </Alert>
          )}

          <Button
            variant={isReady ? 'default' : 'outline'}
            className={
              isReady
                ? 'bg-success hover:bg-success/90 text-white px-6 md:w-auto w-full font-semibold'
                : 'border-gray-200 text-bodytext hover:bg-gray-50 hover:text-dark px-6 md:w-auto w-full'
            }
            disabled={!isReady}
            onClick={handleDownload}
          >
            <Icon icon="solar:download-linear" className="mr-2" height={16} />
            Download (PDF)
          </Button>
        </div>
      </div>
    </CardBox>
  )
}

export default CertificateDetailCard
