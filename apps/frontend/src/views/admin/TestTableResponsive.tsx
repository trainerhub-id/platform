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
import { Loading } from 'src/components/ui/loading'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Participant } from '../../data/mockData'
import { useDaftarPeserta } from './hooks/useDaftarPeserta'

const columnHelper = createColumnHelper<Participant>()

const TestTableResponsive = () => {
  const { participants, loading } = useDaftarPeserta()
  const [globalFilter, setGlobalFilter] = useState('')

  const data = useMemo(() => participants, [participants])

  const columns = [
    columnHelper.accessor('name', {
      header: () => (
        <div className="flex items-center gap-1">
          <Icon icon="solar:user-linear" height={16} /> Nama Peserta
        </div>
      ),
      cell: (info: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
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
          <span className="font-semibold text-dark">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor('contact', {
      header: () => (
        <div className="flex items-center gap-1">
          <Icon icon="solar:phone-linear" height={16} /> Kontak
        </div>
      ),
      cell: (info: any) => <span className="text-gray-500">{info.getValue()}</span>,
    }),
    columnHelper.accessor('paymentStatus', {
      header: () => (
        <div className="flex items-center gap-1">
          <Icon icon="solar:card-linear" height={16} /> Status Pembayaran
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
          <span className={`px-3 py-1 rounded-md text-xs font-medium ${bgClass} capitalize`}>
            {label}
          </span>
        )
      },
    }),
    columnHelper.accessor('dataBnspStatus', {
      header: () => (
        <div className="flex items-center gap-1">
          <Icon icon="solar:file-check-linear" height={16} /> Data BNSP
        </div>
      ),
      cell: (info: any) => {
        const status = info.getValue()
        let bgClass = 'bg-gray-100 text-gray-600'
        if (status === 'Lengkap') bgClass = 'bg-blue-50 text-blue-600'

        return (
          <span className={`px-3 py-1 rounded-md text-xs font-medium ${bgClass}`}>{status}</span>
        )
      },
    }),
    columnHelper.accessor('portfolioStatus', {
      header: () => (
        <div className="flex items-center gap-1">
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
          <span className={`px-3 py-1 rounded-md text-xs font-medium ${bgClass}`}>{status}</span>
        )
      },
    }),
    columnHelper.accessor('certificateStatus', {
      header: () => (
        <div className="flex items-center gap-1">
          <Icon icon="solar:verified-check-linear" height={16} /> Sertifikat
        </div>
      ),
      cell: (info: any) => {
        const status = info.getValue()
        let bgClass = 'bg-gray-100 text-gray-600'
        if (status === 'Terbit') bgClass = 'bg-green-50 text-green-600'

        return (
          <span className={`px-3 py-1 rounded-md text-xs font-medium ${bgClass}`}>{status}</span>
        )
      },
    }),
    columnHelper.accessor('batch', {
      header: () => (
        <div className="flex items-center gap-1">
          <Icon icon="solar:calendar-linear" height={16} /> Batch
        </div>
      ),
      cell: (info: any) => <span className="text-gray-600 text-sm">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => 'Aksi',
      cell: (info: any) => (
        <button className="bg-[#B58E36] text-white text-xs px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-[#94742C] transition-colors">
          <Icon icon="solar:menu-dots-bold" /> Lihat Detail
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
    <div className="space-y-6">
      {/* Page Title & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-dark">Test Table Responsive.</h1>
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
              className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white">
            <Icon icon="solar:user-plus-bold" className="mr-2" height={18} />
            Tambah Peserta
          </Button>
        </div>
      </div>

      {/* Banner Section */}
      <Card className="relative overflow-hidden bg-dark text-white p-6 sm:p-8 md:p-10 shadow-lg group border-none">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1555899434-94d1368d7dd6?q=80&w=2000&auto=format&fit=crop"
            alt="City Background"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171c26] via-[#171c26]/90 to-transparent"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
          <div className="flex items-center gap-2 text-[#F3A53F]">
            <Icon icon="solar:users-group-rounded-linear" height={24} className="flex-shrink-0" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Test Responsive Table</h2>
          </div>

          <div className="flex flex-wrap gap-4 sm:gap-6 md:gap-8 mt-6 sm:mt-8">
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

      {/* Table Section - MENGGUNAKAN STRUKTUR DARI STICKY TABLE */}
      <div
        className="text-bodytext border-0 card no-inset no-ring bg-white dark:bg-darkgray p-0 dark:shadow-dark-md shadow-md"
        style={{ borderRadius: '7px' }}
      >
        {/* Table Header */}
        <div className="bg-[#B58E36] px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-white [&_*]:text-white">
          <h3 className="font-semibold text-base sm:text-lg text-white">Tabel Daftar Peserta</h3>
          <button className="bg-white/20 hover:bg-white/30 text-white text-sm py-1.5 px-4 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap">
            <Icon icon="solar:filter-linear" height={18} />
            Filter
            <Icon icon="solar:alt-arrow-down-linear" height={14} />
          </button>
        </div>

        {/* STRUKTUR PERSIS SEPERTI STICKY TABLE */}
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="text-base text-ld font-semibold text-left border-b border-ld px-4 py-3"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border dark:divide-darkborder">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="whitespace-nowrap py-3 px-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
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
                      ? 'bg-[#B58E36] text-white'
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
      </div>
    </div>
  )
}

export default TestTableResponsive
