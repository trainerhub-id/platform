import { Icon } from '@iconify/react'
import { useState } from 'react'
import api from 'src/api/axios'
import { Loading } from 'src/components/ui/loading'
import CardBox from '../../components/shared/CardBox'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { CreateBatchModal } from './components/CreateBatchModal'
import { useManageTraining } from './hooks/useManageTraining'

const ManageTraining = () => {
  const { trainings, loading, refetch, deleteTraining } = useManageTraining()
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'upcoming' | 'completed'>(
    'all',
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<any>(null)

  const handleCreate = () => {
    setSelectedBatch(null)
    setIsModalOpen(true)
  }

  const handleEdit = (batch: any) => {
    // Map backend dates to frontend format if needed, but assuming batch object is usable
    // We might need to ensure date strings are compatible
    // Assuming batch comes from 'filteredTrainings' which might have transformed data
    // Let's use the raw batch object if possible or adapt it back
    setSelectedBatch(batch)
    setIsModalOpen(true)
  }

  const handleExport = async (batchId: string, batchName: string) => {
    try {
      // Initiate file download
      // Note: We need api to support blob response type, or use native fetch/axios directly
      // Assuming our api wrapper handles it or we access underlying axios
      // Let's use a direct window.open or hidden anchor for simplicity if get request returns file
      // But usually we need auth headers.
      // Best approach: api.get with responseType: 'blob'
      const response = await api.get(`/admin/export/batch/${batchId}`, {
        responseType: 'blob',
      })

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Documents_${batchName.replace(/\s+/g, '_')}.zip`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
    } catch (error) {
      console.error('Export failed', error)
      alert('Gagal mengunduh dokumen batch.')
    }
  }

  const handleDelete = async (batchId: string, batchName: string) => {
    const confirmed = window.confirm(
      `Hapus batch "${batchName}"?\n\nData payment session terkait batch ini juga akan dihapus.`,
    )
    if (!confirmed) return

    try {
      await deleteTraining(batchId)
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Gagal menghapus batch')
    }
  }

  if (loading) {
    return <Loading fullPage />
  }

  const filteredTrainings = trainings.filter((training) => {
    if (statusFilter === 'all') return true
    // Mock status logic since backend might not return explicit status yet
    // In real app, check training.status
    if (statusFilter === 'running') return training.status === 'Running'
    if (statusFilter === 'upcoming') return training.status === 'Upcoming'
    if (statusFilter === 'completed') return training.status === 'Completed'
    return false
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-dark">Kelola Training</h2>
          <p className="text-sm text-bodytext">
            Buat, edit, dan pantau batch training yang berjalan.
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md shrink-0"
          onClick={handleCreate}
        >
          <Icon icon="solar:add-circle-linear" className="mr-2" height={18} />
          Buat Batch Baru
        </Button>
      </div>

      {/* Filter Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CardBox
          className={`p-4 flex items-center gap-4 border-l-4 transition-all cursor-pointer ${statusFilter === 'all' ? 'border-l-primary bg-primary/5 shadow-sm' : 'border-l-gray-300 hover:border-l-primary'}`}
          onClick={() => setStatusFilter('all')}
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            <Icon icon="solar:list-bold" height={24} />
          </div>
          <div>
            <p className="text-xs text-bodytext uppercase font-semibold">Semua</p>
            <h4 className="text-2xl font-bold text-dark">{trainings.length}</h4>
          </div>
        </CardBox>
        {/* ... (Other filter cards logic can remain or be simplified) ... */}
      </div>

      {/* Training List */}
      <CardBox>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-dark">Daftar Batch Training</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Icon
                icon="solar:magnifer-linear"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                height={16}
              />
              <input
                type="text"
                placeholder="Cari training..."
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-primary w-64"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="py-3 px-4 text-xs font-semibold text-bodytext uppercase tracking-wider">
                  Nama Batch
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-bodytext uppercase tracking-wider">
                  Tanggal & Lokasi
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-bodytext uppercase tracking-wider text-center">
                  Peserta
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-bodytext uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-bodytext uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTrainings.length > 0 ? (
                filteredTrainings.map((batch) => {
                  return (
                    <tr
                      key={batch.id}
                      className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => handleEdit(batch)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 shadow-sm border border-gray-100">
                            {/* Placeholder Image */}
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-gray-500">
                              Img
                            </div>
                          </div>
                          <div>
                            <p className="text-base font-bold text-dark leading-tight">
                              {batch.name}
                            </p>
                            <p className="text-xs text-[#B58E36] font-medium mt-1">
                              Trainer: {batch.trainerName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-sm text-bodytext font-medium">
                            <Icon
                              icon="solar:calendar-linear"
                              className="text-[#B58E36]"
                              height={16}
                            />
                            <span>
                              {new Date(batch.startDate).toLocaleDateString()} -{' '}
                              {batch.tanggalSelesai
                                ? new Date(batch.tanggalSelesai).toLocaleDateString()
                                : 'TBD'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-bodytext">
                            <Icon icon="solar:map-point-linear" height={14} />
                            <span className="truncate max-w-[180px]" title={batch.location}>
                              {batch.location}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-base font-bold text-dark">
                            {batch.participants}
                          </span>
                          {/* Progress bar mocked for now */}
                          <span className="text-[10px] text-gray-400 mt-1">
                            {batch.participants}/?
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          className={`shadow-none font-semibold px-3 py-1 border-none capitalize
                                                    ${
                                                      batch.status === 'running'
                                                        ? 'bg-primary/10 text-primary'
                                                        : batch.status === 'completed'
                                                          ? 'bg-green-100 text-green-600'
                                                          : batch.status === 'draft'
                                                            ? 'bg-gray-100 text-gray-600'
                                                            : 'bg-orange-100 text-orange-600' // upcoming
                                                    }
                                                 `}
                        >
                          {batch.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 p-0 rounded-xl hover:bg-blue-50 text-[#4287F5] transition-all hover:scale-110"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(batch)
                            }}
                            title="Edit Batch"
                          >
                            <Icon icon="solar:pen-linear" height={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 p-0 rounded-xl hover:bg-green-50 text-green-600 transition-all hover:scale-110"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExport(batch.id, batch.name)
                            }}
                            title="Export Dokumen"
                          >
                            <Icon icon="solar:export-linear" height={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 p-0 rounded-xl hover:bg-red-50 text-red-600 transition-all hover:scale-110"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(batch.id, batch.name)
                            }}
                            title="Hapus Batch"
                          >
                            <Icon icon="solar:trash-bin-trash-linear" height={18} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <Icon icon="solar:box-minimalistic-linear" height={64} />
                      <p className="mt-2 font-medium">Tidak ada training dengan status ini</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardBox>

      <CreateBatchModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={refetch}
        batchToEdit={selectedBatch}
      />
    </div>
  )
}

export default ManageTraining
