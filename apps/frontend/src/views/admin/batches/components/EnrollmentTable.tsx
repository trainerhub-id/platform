import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import api from 'src/api/axios'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Loading } from 'src/components/ui/loading'

type EnrollmentTableProps = {
  batchId: string
}

type EnrollmentRow = {
  id: string
  pesertaName?: string | null
  pesertaEmail?: string | null
  pesertaPhone?: string | null
  tierName?: string | null
  paymentStatus?: string | null
  documentStatus?: string | null
  certificateStatus?: string | null
}

const paymentClassName = (status?: string | null) => {
  if (status === 'paid') return 'border-none bg-green-50 text-green-700'
  if (status === 'pending') return 'border-none bg-amber-50 text-amber-700'
  return 'border-none bg-gray-100 text-gray-700'
}

const formatPaymentStatus = (status?: string | null) => {
  if (status === 'paid') return 'Paid'
  if (status === 'pending') return 'Pending'
  if (status === 'unpaid') return 'Unpaid'
  return status || 'Unknown'
}

export const EnrollmentTable = ({ batchId }: EnrollmentTableProps) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-batch-enrollments', batchId],
    queryFn: async () => {
      const res = await api.get(`/admin/batches/${batchId}/enrollments`)
      return (res.data.enrollments ?? []) as EnrollmentRow[]
    },
    enabled: Boolean(batchId),
  })

  if (isLoading) return <Loading />

  if (error) {
    return (
      <div className="rounded-md border border-red-100 bg-red-50 p-6 text-center">
        <Icon icon="solar:danger-triangle-linear" height={36} className="mx-auto text-red-500" />
        <h3 className="mt-3 font-bold text-dark">Member batch tidak dapat dimuat</h3>
        <p className="mt-1 text-sm text-bodytext">Coba refresh data member batch ini.</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4 rounded-xl">
          Refresh
        </Button>
      </div>
    )
  }

  const enrollments = data ?? []

  return (
    <div className="overflow-hidden rounded-md border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-bodytext">Member</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-bodytext">Paket</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-bodytext">Bayar</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-bodytext">Dokumen</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-bodytext">
                Sertifikat
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-bodytext">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {enrollments.length > 0 ? (
              enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-dark">
                      {enrollment.pesertaName || 'Peserta tanpa nama'}
                    </div>
                    <div className="text-xs text-bodytext">
                      {enrollment.pesertaEmail || enrollment.pesertaPhone || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-dark">{enrollment.tierName || '-'}</td>
                  <td className="px-4 py-4">
                    <Badge className={paymentClassName(enrollment.paymentStatus)}>
                      {formatPaymentStatus(enrollment.paymentStatus)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-bodytext">
                    {enrollment.documentStatus || 'Belum upload'}
                  </td>
                  <td className="px-4 py-4 text-sm text-bodytext">
                    {enrollment.certificateStatus || 'Belum'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl">
                        Detail
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl">
                        Dokumen
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl">
                        Sertifikat
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <Icon
                    icon="solar:users-group-rounded-linear"
                    height={48}
                    className="mx-auto text-bodytext/50"
                  />
                  <p className="mt-2 font-medium text-dark">Belum ada member di batch ini</p>
                  <p className="mt-1 text-sm text-bodytext">
                    Member akan muncul setelah registrasi atau assign manual.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
