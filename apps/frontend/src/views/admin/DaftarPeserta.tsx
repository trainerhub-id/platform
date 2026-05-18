import { Icon } from '@iconify/react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import CardBox from '../../components/shared/CardBox'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Loading } from '../../components/ui/loading'
import { Participant } from '../../data/mockData'
import { AddPesertaModal } from './components/AddPesertaModal'
import { ParticipantDetailModal } from './components/ParticipantDetailModal'
import { useDaftarPeserta } from './hooks/useDaftarPeserta'

const columnHelper = createColumnHelper<Participant>()

const DaftarPeserta = () => {
  const { participants, loading, refetch } = useDaftarPeserta()
  const [globalFilter, setGlobalFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Filter states
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [bnspFilter, setBnspFilter] = useState<string>('all')
  const [portfolioFilter, setPortfolioFilter] = useState<string>('all')
  const [certificateFilter, setCertificateFilter] = useState<string>('all')
  const [batchFilter, setBatchFilter] = useState<string>('all')

  // UseMemo to ensure table doesn't re-render unnecessarily if data ref calls changed and apply filters
  const data = useMemo(() => {
    let filtered = [...participants]

    if (paymentFilter !== 'all') {
      filtered = filtered.filter((p) => p.paymentStatus === paymentFilter)
    }
    if (bnspFilter !== 'all') {
      filtered = filtered.filter((p) => p.dataBnspStatus === bnspFilter)
    }
    if (portfolioFilter !== 'all') {
      filtered = filtered.filter((p) => p.portfolioStatus === portfolioFilter)
    }
    if (certificateFilter !== 'all') {
      filtered = filtered.filter((p) => p.certificateStatus === certificateFilter)
    }
    if (batchFilter !== 'all') {
      filtered = filtered.filter((p) => p.batch === batchFilter)
    }

    return filtered
  }, [participants, paymentFilter, bnspFilter, portfolioFilter, certificateFilter, batchFilter])

  // Get unique batch values from participants
  const availableBatches = useMemo(() => {
    const batches = [...new Set(participants.map((p) => p.batch))]
    return batches.sort()
  }, [participants])

  const handleResetFilters = () => {
    setPaymentFilter('all')
    setBnspFilter('all')
    setPortfolioFilter('all')
    setCertificateFilter('all')
    setBatchFilter('all')
  }

  const activeFiltersCount = [
    paymentFilter,
    bnspFilter,
    portfolioFilter,
    certificateFilter,
    batchFilter,
  ].filter((f) => f !== 'all').length

  const columns = [
    columnHelper.accessor('name', {
      header: () => (
        <div className="flex items-center gap-1">
          <Icon icon="solar:user-linear" height={16} /> Nama Peserta
        </div>
      ),
      cell: (info: any) => (
        <div className="flex items-center gap-2 min-w-[180px]">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            <img
              src={info.row.original.avatar}
              alt={info.getValue()}
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src =
                  `https://ui-avatars.com/api/?name=${info.getValue()}&background=random`
              }}
            />
          </div>
          <span className="font-semibold text-dark truncate">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor('contact', {
      header: () => (
        <div className="flex items-center gap-1">
          <Icon icon="solar:phone-linear" height={16} /> Kontak
        </div>
      ),
      cell: (info: any) => {
        const contact = info.getValue()
        // Split by | or extract phone and email
        const parts = contact.split('|').map((s: string) => s.trim())
        const phone = parts[0] || ''
        const email = parts[1] || ''

        return (
          <div className="flex flex-col gap-0.5">
            {phone && <span className="text-gray-700 text-xs">{phone}</span>}
            {email && <span className="text-gray-500 text-xs">{email}</span>}
          </div>
        )
      },
    }),
    columnHelper.accessor('paymentStatus', {
      header: () => (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Icon icon="solar:card-linear" height={16} /> Status Bayar
        </div>
      ),
      cell: (info: any) => {
        const status = info.getValue() as string
        let bgClass = 'bg-gray-100 text-gray-600'
        let label = status

        switch (status) {
          case 'paid':
            bgClass = 'bg-green-50 text-green-600'
            label = 'Lunas'
            break
          case 'unpaid':
            bgClass = 'bg-red-50 text-red-600'
            label = 'Belum Lunas'
            break
          case 'pending':
            bgClass = 'bg-yellow-50 text-yellow-600'
            label = 'Pending'
            break
          case 'cancel':
            bgClass = 'bg-gray-200 text-gray-500'
            label = 'Batal'
            break
          default:
            label = status
        }

        return (
          <span
            className={`px-2 py-1 rounded-md text-xs font-medium ${bgClass} capitalize inline-block`}
          >
            {label}
          </span>
        )
      },
    }),
    columnHelper.accessor('dataBnspStatus', {
      header: () => (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Icon icon="solar:file-check-linear" height={16} /> Data BNSP
        </div>
      ),
      cell: (info: any) => {
        const status = info.getValue()
        let bgClass = 'bg-gray-100 text-gray-600'
        if (status === 'Lengkap') bgClass = 'bg-blue-50 text-blue-600'

        return (
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${bgClass} inline-block`}>
            {status}
          </span>
        )
      },
    }),
    columnHelper.accessor('portfolioStatus', {
      header: () => (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Icon icon="solar:folder-with-files-linear" height={16} /> Dokumen
        </div>
      ),
      cell: (info: any) => {
        const status = info.getValue()
        let bgClass = 'bg-gray-100 text-gray-600'
        if (status === 'Approved') bgClass = 'bg-green-50 text-green-600'
        if (status === 'Revisi') bgClass = 'bg-red-50 text-red-600'
        if (status === 'Pending') bgClass = 'bg-yellow-50 text-yellow-600'

        return (
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${bgClass} inline-block`}>
            {status}
          </span>
        )
      },
    }),
    columnHelper.accessor('certificateStatus', {
      header: () => (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Icon icon="solar:verified-check-linear" height={16} /> Sertifikat
        </div>
      ),
      cell: (info: any) => {
        const status = info.getValue()
        let bgClass = 'bg-gray-100 text-gray-600'
        if (status === 'Terbit') bgClass = 'bg-green-50 text-green-600'

        return (
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${bgClass} inline-block`}>
            {status}
          </span>
        )
      },
    }),
    columnHelper.accessor('batch', {
      header: () => (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Icon icon="solar:calendar-linear" height={16} /> Batch
        </div>
      ),
      cell: (info: any) => <span className="text-gray-600 text-xs">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <span className="whitespace-nowrap">Aksi</span>,
      cell: (info: any) => (
        <button
          className="bg-[var(--color-gold)] text-white p-2 rounded-lg hover:bg-[#94742C] transition-colors"
          onClick={() => {
            setSelectedParticipantId(info.row.original.id)
            setIsDetailModalOpen(true)
          }}
          title="Lihat Detail"
        >
          <Icon icon="solar:menu-dots-bold" height={18} />
        </button>
      ),
    }),
  ]

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  })

  if (loading) {
    return <Loading fullPage />
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden px-0">
      {/* Page Title & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Icon
              icon="solar:magnifer-linear"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              height={18}
            />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Cari nama peserta..."
              className="pl-10 pr-4 py-2 border rounded-md w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md"
            onClick={() => setIsModalOpen(true)}
          >
            <Icon icon="solar:user-plus-linear" className="mr-2" height={18} />
            Tambah Peserta
          </Button>
        </div>
      </div>

      {/* Banner Section */}
      <Card className="relative overflow-hidden bg-dark text-white p-6 sm:p-8 md:p-10 shadow-lg group border-none">
        {/* Background Image/Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1555899434-94d1368d7dd6?q=80&w=2000&auto=format&fit=crop"
            alt="City Background"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171c26] via-[#171c26]/90 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-center gap-2 text-[#F3A53F] mb-4">
            <Icon icon="solar:users-group-rounded-linear" height={24} className="flex-shrink-0" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Peserta – Training Center</h2>
          </div>

          <div className="flex flex-wrap gap-4 sm:gap-6 md:gap-8">
            <div>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Icon icon="solar:calendar-linear" /> Tahun
              </div>
              <div className="text-[#F3A53F] font-bold text-lg">{new Date().getFullYear()}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Icon icon="solar:buildings-2-linear" /> Lokasi
              </div>
              <div className="text-[#F3A53F] font-bold text-lg">Jakarta</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Icon icon="solar:user-check-linear" /> Peserta terdaftar
              </div>
              <div className="text-[#F3A53F] font-bold text-lg">{data.length} Peserta</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Table Section */}
      <CardBox className="p-0 overflow-hidden">
        {/* Table Header */}
        <div className="bg-[var(--color-gold)] px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-white [&_*]:text-white">
          <h3 className="font-semibold text-base sm:text-lg text-white">Tabel Daftar Peserta</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="bg-white/20 hover:bg-white/30 text-white text-sm py-1.5 px-4 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap">
                <Icon icon="solar:filter-linear" height={18} />
                Filter
                {activeFiltersCount > 0 && (
                  <span className="bg-white text-[var(--color-gold)] text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {activeFiltersCount}
                  </span>
                )}
                <Icon icon="solar:alt-arrow-down-linear" height={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Filter Data</span>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-primary hover:underline"
                  >
                    Reset
                  </button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Payment Status Filter */}
              <div className="px-2 py-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Status Bayar</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">Semua</option>
                  <option value="paid">Lunas</option>
                  <option value="unpaid">Belum Lunas</option>
                  <option value="pending">Pending</option>
                  <option value="cancel">Batal</option>
                </select>
              </div>

              {/* BNSP Status Filter */}
              <div className="px-2 py-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Data BNSP</label>
                <select
                  value={bnspFilter}
                  onChange={(e) => setBnspFilter(e.target.value)}
                  className="w-full text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">Semua</option>
                  <option value="Lengkap">Lengkap</option>
                  <option value="Tidak Lengkap">Tidak Lengkap</option>
                </select>
              </div>

              {/* Portfolio Status Filter */}
              <div className="px-2 py-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Dokumen</label>
                <select
                  value={portfolioFilter}
                  onChange={(e) => setPortfolioFilter(e.target.value)}
                  className="w-full text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">Semua</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Revisi">Revisi</option>
                </select>
              </div>

              {/* Certificate Status Filter */}
              <div className="px-2 py-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Sertifikat</label>
                <select
                  value={certificateFilter}
                  onChange={(e) => setCertificateFilter(e.target.value)}
                  className="w-full text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">Semua</option>
                  <option value="Terbit">Terbit</option>
                  <option value="Belum Terbit">Belum Terbit</option>
                </select>
              </div>

              {/* Batch Filter */}
              <div className="px-2 py-2">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Batch</label>
                <select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="w-full text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">Semua</option>
                  {availableBatches.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* React Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left py-3 px-3 text-gray-500 font-medium text-xs"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y bg-white">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-3 text-xs">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination (Dynamic UI) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 border-t bg-gray-50/50">
          <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
            Menampilkan {table.getRowModel().rows.length} dari{' '}
            {table.getFilteredRowModel().rows.length} peserta
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 rounded-full border bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <Icon icon="solar:alt-arrow-left-linear" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: table.getPageCount() }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => table.setPageIndex(page - 1)}
                  className={`w-10 h-10 rounded-full font-medium flex items-center justify-center transition-all ${
                    table.getState().pagination.pageIndex === page - 1
                      ? 'bg-[var(--color-gold)] text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 rounded-full border bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <Icon icon="solar:alt-arrow-right-linear" />
            </button>
          </div>
        </div>
      </CardBox>

      <AddPesertaModal open={isModalOpen} onOpenChange={setIsModalOpen} onSuccess={refetch} />

      <ParticipantDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        participantId={selectedParticipantId}
      />
    </div>
  )
}

export default DaftarPeserta
