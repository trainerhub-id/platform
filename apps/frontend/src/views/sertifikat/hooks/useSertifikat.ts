import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from 'src/api/axios'

interface Certificate {
  id: string
  certificateNumber: string
  courseName: string
  completedAt: string
  issuedAt: string
  pdfUrl: string | null
  status: string
}

interface EligibleCourse {
  courseId: string
  courseName: string
  progress: number
  hasCertificate: boolean
  certificateId: string | null
}

const adaptCertificate = (cert: Certificate) => {
  const baseUrl = window.location.origin
  const publicUrl = cert.certificateNumber
    ? `${baseUrl}/validate/${cert.certificateNumber}`
    : undefined

  return {
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
    certificateUrl: publicUrl,
  }
}

export const useSertifikat = () => {
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

      if (certsResult.status === 'rejected') {
        console.warn('Failed to fetch /certificates/me:', certsResult.reason)
      }

      if (eligibleResult.status === 'rejected') {
        console.warn('Failed to fetch /certificates/eligible-courses:', eligibleResult.reason)
      }

      if (allSertsResult.status === 'rejected') {
        console.warn('Failed to fetch /sertifikat/me:', allSertsResult.reason)
      }

      // Start with empty array - we'll populate from /sertifikat/me first
      const adaptedCerts: any[] = []

      // Process all certificates from /sertifikat/me FIRST (has type field)
      const allSerts = Array.isArray(allSertsRes.data) ? allSertsRes.data : []

      // Track certificate IDs to prevent duplicates
      const existingIds = new Set<string>()

      // Add certificates from /sertifikat/me (both trainerhub uploaded and bnsp)
      for (const cert of allSerts) {
        // Skip if already processed
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
          // TrainerHub certificate uploaded by admin
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

      // THEN add auto-generated certificates from /certificates/me
      // (these are ONLY auto-generated TrainerHub certs, not uploaded ones)
      const autoCerts = Array.isArray(certsRes.data) ? certsRes.data : []
      for (const cert of autoCerts) {
        // Skip if already exists (uploaded version takes precedence)
        if (existingIds.has(cert.id)) continue

        adaptedCerts.push(adaptCertificate(cert))
        existingIds.add(cert.id)
      }

      setCertificates(adaptedCerts)

      const eligible = Array.isArray(eligibleRes.data) ? eligibleRes.data : []
      setEligibleCourses(eligible)
    } catch (e) {
      setCertificates([])
      setEligibleCourses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const generateCertificate = async (courseId: string) => {
    try {
      setGenerating(true)
      await api.post(`/certificates/generate/${courseId}`)
      toast.success('Sertifikat berhasil dibuat!')

      // Refresh data
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
