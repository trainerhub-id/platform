import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import api from 'src/api/axios'
import CardBox from 'src/components/shared/CardBox'
import { Button } from 'src/components/ui/button'
import { Loading } from 'src/components/ui/loading'

interface CertificateValidation {
  valid: boolean
  certificateNumber: string
  pesertaName: string
  courseName: string
  completedAt: string
  issuedAt: string
  status: string
  pdfUrl: string | null
}

const ValidateCertificate = () => {
  const { certificateNumber } = useParams<{ certificateNumber: string }>()
  const navigate = useNavigate()
  const [result, setResult] = useState<CertificateValidation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const validateCertificate = async () => {
      if (!certificateNumber) {
        setError('Certificate number not provided')
        setLoading(false)
        return
      }

      try {
        const response = await api.get(`/certificates/validate/${certificateNumber}`)
        setResult(response.data)
        setError(null)
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Certificate not found')
        } else {
          setError('Failed to validate certificate. Please try again.')
        }
        console.error('Validation error:', err)
      } finally {
        setLoading(false)
      }
    }

    validateCertificate()
  }, [certificateNumber])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading fullPage />
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <CardBox className="max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <Icon icon="solar:close-circle-bold" className="text-error" height={48} />
          </div>
          <h2 className="text-2xl font-bold text-dark mb-2">Invalid Certificate</h2>
          <p className="text-bodytext mb-6">{error || 'Certificate not found in our system.'}</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Back to Home
          </Button>
        </CardBox>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <CardBox className="max-w-2xl w-full p-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Icon icon="solar:verified-check-bold" className="text-success" height={48} />
          </div>
          <h1 className="text-3xl font-bold text-success mb-2">✓ Valid Certificate</h1>
          <div className="inline-block px-4 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
            {result.status.toUpperCase()}
          </div>
        </div>

        {/* Certificate Details */}
        <div className="space-y-6 mb-8">
          <div className="border-b border-gray-200 pb-4">
            <p className="text-xs text-bodytext uppercase tracking-wide mb-1">Certificate Number</p>
            <p className="text-xl font-bold text-dark">{result.certificateNumber}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-bodytext uppercase tracking-wide mb-1">Awarded To</p>
              <p className="text-lg font-semibold text-dark">{result.pesertaName}</p>
            </div>

            <div>
              <p className="text-xs text-bodytext uppercase tracking-wide mb-1">Course</p>
              <p className="text-lg font-semibold text-dark">{result.courseName}</p>
            </div>

            <div>
              <p className="text-xs text-bodytext uppercase tracking-wide mb-1">Completed On</p>
              <p className="text-base text-dark">{formatDate(result.completedAt)}</p>
            </div>

            <div>
              <p className="text-xs text-bodytext uppercase tracking-wide mb-1">Issued On</p>
              <p className="text-base text-dark">{formatDate(result.issuedAt)}</p>
            </div>
          </div>
        </div>

        {/* Download Button */}
        {result.pdfUrl && (
          <div className="text-center">
            <a
              href={result.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Icon icon="solar:download-linear" height={20} />
              Download Certificate
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-bodytext">
            This certificate is issued by TrainerHub and can be verified at any time.
          </p>
        </div>
      </CardBox>
    </div>
  )
}

export default ValidateCertificate
