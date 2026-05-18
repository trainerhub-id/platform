import { useState } from 'react'
import { toast } from 'react-toastify'
import api from 'src/api/workspace-axios'
import { useOptionalWorkspace } from 'src/context/WorkspaceContext'

interface EligibleCourse {
  courseId: string
  courseName: string
  progress: number
  hasCertificate: boolean
  certificateId: string | null
}

export const useSertifikat = () => {
  const ws = useOptionalWorkspace()
  const slug = ws?.slug ?? null

  const [certificates, setCertificates] = useState<any[]>([])
  const [eligibleCourses, setEligibleCourses] = useState<EligibleCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const fetchData = async () => {
    try {
      const [certsResult, eligibleResult, allSertsResult] = await Promise.allSettled([
        api.get('/certificates/me'),
        api.get('/certificates/eligible-courses'),
        api.get('/sertifikat/me'),
      ])

      const certsRes = certsResult.status === 'fulfilled' ? certsResult.value : { data: [] }
      const eligibleRes =
        eligibleResult.status === 'fulfilled' ? eligibleResult.value : { data: [] }
      const allSertsRes =
        allSertsResult.status === 'fulfilled' ? allSertsResult.value : { data: [] }

      const adaptedCerts: any[] = []
      const allSerts = Array.isArray(allSertsRes.data) ? allSertsRes.data : []
      const existingIds = new Set<string>()

      for (const cert of allSerts) {
        if (existingIds.has(cert.id)) continue
        if (cert.type === 'bnsp') {
          adaptedCerts.push({
            id: cert.id,
            title: 'Sertifikat BNSP',
            issuer: cert.lsp || 'BNSP',
            certType: 'bnsp',
            date: cert.issuedDate
              ? new Date(cert.issuedDate).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '-',
            file: cert.fileUrl || '#',
            image: '/src/assets/images/certificates/cert-placeholder.jpg',
            status: 'issued',
            certificateNumber: cert.nomorSertifikat || '-',
            certificateUrl: cert.fileUrl,
          })
          existingIds.add(cert.id)
        } else if (cert.type === 'trainerhub') {
          adaptedCerts.push({
            id: cert.id,
            title: cert.courseName || 'Sertifikat TrainerHub',
            issuer: 'TrainerHub',
            certType: 'trainerhub',
            date: cert.issuedDate
              ? new Date(cert.issuedDate).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '-',
            file: cert.fileUrl || '#',
            image: '/src/assets/images/certificates/cert-placeholder.jpg',
            status: 'issued',
            certificateNumber: cert.nomorSertifikat || '-',
            certificateUrl: cert.fileUrl,
          })
          existingIds.add(cert.id)
        }
      }

      const autoCerts = Array.isArray(certsRes.data?.certificates)
        ? certsRes.data.certificates
        : Array.isArray(certsRes.data)
          ? certsRes.data
          : []
      for (const cert of autoCerts) {
        if (existingIds.has(cert.id)) continue
        const baseUrl = window.location.origin
        adaptedCerts.push({
          id: cert.id,
          title: cert.courseName,
          issuer: 'TrainerHub',
          certType: 'trainerhub',
          date: new Date(cert.completedAt).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          file: cert.pdfUrl || '#',
          image: '/src/assets/images/certificates/cert-placeholder.jpg',
          status: cert.status,
          certificateNumber: cert.certificateNumber,
          certificateUrl: cert.certificateNumber
            ? `${baseUrl}/validate/${cert.certificateNumber}`
            : undefined,
        })
        existingIds.add(cert.id)
      }

      setCertificates(adaptedCerts)
      const eligible = Array.isArray(eligibleRes.data) ? eligibleRes.data : []
      setEligibleCourses(eligible)
    } catch (_e) {
      setCertificates([])
      setEligibleCourses([])
    } finally {
      setLoading(false)
    }
  }

  // Re-fetch when workspace changes
  const [lastSlug, setLastSlug] = useState<string | null>(null)
  if (slug !== lastSlug) {
    setLastSlug(slug)
    setLoading(true)
    fetchData()
  }

  const generateCertificate = async (courseId: string) => {
    try {
      setGenerating(true)
      await api.post(`/certificates/generate/${courseId}`)
      toast.success('Sertifikat berhasil dibuat!')
      await fetchData()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal membuat sertifikat')
    } finally {
      setGenerating(false)
    }
  }

  return {
    certificates,
    eligibleCourses,
    loading,
    generating,
    generateCertificate,
  }
}
