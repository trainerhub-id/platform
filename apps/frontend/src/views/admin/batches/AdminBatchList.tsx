import { Icon } from '@iconify/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import CardBox from 'src/components/shared/CardBox'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Loading } from 'src/components/ui/loading'
import { useManageTraining } from '../hooks/useManageTraining'

type BatchStatusFilter = 'all' | 'draft' | 'open' | 'running' | 'completed'

const statusLabels: Record<string, string> = {
  all: 'Semua',
  draft: 'Draft',
  open: 'Open',
  running: 'Running',
  completed: 'Completed',
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Tanggal belum diatur'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Tanggal belum diatur'
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getBatchName = (batch: any) => batch.name || batch.namaBatch || 'Batch tanpa nama'

const getStatusClassName = (status?: string | null) => {
  if (status === 'open' || status === 'running') return 'bg-primary/10 text-primary border-none'
  if (status === 'completed') return 'bg-green-100 text-green-700 border-none'
  if (status === 'draft') return 'bg-gray-100 text-gray-700 border-none'
  return 'bg-orange-100 text-orange-700 border-none'
}

const AdminBatchList = () => {
  const { trainings, loading } = useManageTraining()
  const [statusFilter, setStatusFilter] = useState<BatchStatusFilter>('all')
  const [search, setSearch] = useState('')

  const filteredBatches = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return trainings.filter((batch) => {
      const statusMatches = statusFilter === 'all' || batch.status === statusFilter
      const searchable = [getBatchName(batch), batch.trainerName, batch.courseName, batch.location]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return statusMatches && (!keyword || searchable.includes(keyword))
    })
  }, [search, statusFilter, trainings])

  const statusCounts = useMemo(() => {
    return trainings.reduce<Record<string, number>>(
      (acc, batch) => {
        const status = batch.status || 'draft'
        acc.all += 1
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      { all: 0 },
    )
  }, [trainings])

  if (loading) {
    return <Loading fullPage />
  }

  const filters: BatchStatusFilter[] = ['all', 'draft', 'open', 'running', 'completed']

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark">Kelola Batch</h2>
          <p className="text-sm text-bodytext">
            Pantau batch, peserta, paket, dokumen, dan aktivitas dari satu workspace.
          </p>
        </div>
        <Button
          asChild
          className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md shrink-0"
        >
          <Link to="/admin/manage-training">
            <Icon icon="solar:add-circle-linear" className="mr-2" height={18} />
            Buat Batch Baru
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`rounded-xl border p-4 text-left transition-all ${
              statusFilter === filter
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-gray-200 bg-white hover:border-primary/60'
            }`}
          >
            <p className="text-xs font-semibold uppercase text-bodytext">{statusLabels[filter]}</p>
            <p className="mt-1 text-2xl font-bold text-dark">{statusCounts[filter] || 0}</p>
          </button>
        ))}
      </div>

      <CardBox className="p-0">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
          <h3 className="font-bold text-dark">Daftar Batch</h3>
          <div className="relative w-full md:w-72">
            <Icon
              icon="solar:magnifer-linear"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              height={16}
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari batch..."
              className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-bodytext">
                  Batch
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-bodytext">
                  Jadwal
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-bodytext">
                  Paket
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-bodytext">
                  Peserta
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-bodytext">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-bodytext">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-4">
                      <div>
                        <Link
                          to={`/admin/batches/${batch.id}`}
                          className="text-base font-bold leading-tight text-dark hover:text-primary"
                        >
                          {getBatchName(batch)}
                        </Link>
                        <p className="mt-1 text-xs font-medium text-[#B58E36]">
                          Mentor: {batch.trainerName || 'TBD'}
                        </p>
                        <p className="mt-1 text-xs text-bodytext">
                          {batch.courseName || 'Kelas belum dipilih'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1.5 text-sm text-bodytext">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Icon
                            icon="solar:calendar-linear"
                            className="text-[#B58E36]"
                            height={16}
                          />
                          <span>
                            {formatDate(batch.startDate || batch.tanggal)} -{' '}
                            {formatDate(batch.endDate || batch.tanggalSelesai)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Icon icon="solar:map-point-linear" height={14} />
                          <span className="max-w-[220px] truncate" title={batch.location}>
                            {batch.location || 'Lokasi belum diatur'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-bodytext">
                        {batch.courseName || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-base font-bold text-dark">
                        {batch.participants || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={`capitalize ${getStatusClassName(batch.status)}`}>
                        {batch.status || 'draft'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        asChild
                        variant="ghost"
                        className="h-9 rounded-xl text-primary hover:bg-primary/10"
                      >
                        <Link to={`/admin/batches/${batch.id}`}>
                          Buka
                          <Icon icon="solar:arrow-right-linear" className="ml-2" height={16} />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <Icon icon="solar:box-minimalistic-linear" height={64} />
                      <p className="mt-2 font-medium">Tidak ada batch yang cocok</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardBox>
    </div>
  )
}

export default AdminBatchList
