import { useEffect, useState } from 'react'
import api from 'src/api/axios'

const adaptBatch = (batch: any) => ({
  ...batch,
  name: batch.namaBatch,
  location: batch.hotel || batch.alamat || 'Online',
  startDate: batch.tanggal,
  endDate: batch.tanggalSelesai || batch.tanggal,
  status: batch.status || 'draft',
  participants: batch.participantsCount || 0,
  trainerName: batch.trainerName || 'TBD',
  courseName: batch.courseName || 'Unassigned',
})

export const useManageTraining = () => {
  const [trainings, setTrainings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTrainings = async () => {
    try {
      setLoading(true)
      const res = await api.get('/batch/list')
      const batches = Array.isArray(res.data) ? res.data : []
      setTrainings(batches.map(adaptBatch))
    } catch (err) {
      console.error('Error fetching trainings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrainings()
  }, [])

  const createTraining = async (data: any) => {
    try {
      await api.post('/batch/create', data)
      await fetchTrainings()
    } catch (err) {
      console.error('Error creating training:', err)
      throw err
    }
  }

  const deleteTraining = async (id: string) => {
    try {
      await api.delete(`/batch/${id}`)
      await fetchTrainings()
    } catch (err) {
      console.error('Error deleting training:', err)
      throw err
    }
  }

  return { trainings, loading, refetch: fetchTrainings, createTraining, deleteTraining }
}
