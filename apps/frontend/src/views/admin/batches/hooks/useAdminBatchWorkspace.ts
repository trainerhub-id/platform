import { useQuery } from '@tanstack/react-query'
import api from 'src/api/axios'

export type AdminBatchWorkspace = {
  id: string
  namaBatch?: string | null
  name?: string | null
  tanggal?: string | null
  tanggalSelesai?: string | null
  status?: string | null
  trainerName?: string | null
  courseName?: string | null
  totalEnrollments?: number | null
  paidEnrollments?: number | null
  pendingPayments?: number | null
  [key: string]: unknown
}

export const useAdminBatchWorkspace = (batchId?: string) => {
  return useQuery<AdminBatchWorkspace>({
    queryKey: ['admin-batch-workspace', batchId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/batches/${batchId}/workspace`)
      return (data.batch ?? data) as AdminBatchWorkspace
    },
    enabled: Boolean(batchId),
    staleTime: 60 * 1000,
  })
}
