import { useEffect, useState } from 'react'
import api from 'src/api/axios'

const adaptPeserta = (p: any) => ({
  id: p.id,
  name: p.nama,
  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama || 'User')}&background=random`,
  contact: `${p.noWa || '-'} | ${p.email || '-'}`,
  paymentStatus: p.paymentStatus || 'pending',
  dataBnspStatus: p.dataBnspStatus || 'Belum Lengkap',
  portfolioStatus: p.portfolioStatus || 'Belum Upload',
  certificateStatus: p.certificateStatus || 'Belum Terbit',
  batch: p.batchName || '-',
  // Additional data for detail view
  documentsCount: p.documentsCount || 0,
  documentsApproved: p.documentsApproved || 0,
  documentsPending: p.documentsPending || 0,
  documentsRevisi: p.documentsRevisi || 0,
})

export const useDaftarPeserta = () => {
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/peserta')
      const data = Array.isArray(res.data) ? res.data : []
      setParticipants(data.map(adaptPeserta))
    } catch (err) {
      console.error('Error fetching participants:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { participants, loading, refetch: fetchData }
}
