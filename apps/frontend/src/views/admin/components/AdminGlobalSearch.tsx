import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import api from 'src/api/axios'
import { Input } from 'src/components/ui/input'

type AdminGlobalSearchProps = {
  value: string
  onChange: (value: string) => void
}

type EnrollmentSearchResult = {
  enrollmentId: string
  pesertaName?: string | null
  pesertaEmail?: string | null
  pesertaPhone?: string | null
  batchId: string
  batchName?: string | null
  tierName?: string | null
  paymentStatus?: string | null
}

const formatPaymentStatus = (status?: string | null) => {
  switch (status) {
    case 'paid':
      return 'Lunas'
    case 'pending':
      return 'Pending'
    case 'unpaid':
      return 'Belum Lunas'
    default:
      return status || 'Status belum tersedia'
  }
}

export const AdminGlobalSearch = ({ value, onChange }: AdminGlobalSearchProps) => {
  const trimmedValue = value.trim()
  const searchQuery = useQuery({
    queryKey: ['admin-enrollment-search', value],
    enabled: trimmedValue.length >= 2,
    queryFn: async () => {
      const res = await api.get('/admin/enrollments/search', {
        params: { q: trimmedValue },
      })
      return (res.data.results ?? []) as EnrollmentSearchResult[]
    },
  })

  const results = searchQuery.data ?? []
  const showDropdown = trimmedValue.length >= 2

  return (
    <div className="relative w-full max-w-xl">
      <Icon
        icon="solar:magnifer-linear"
        height={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Cari peserta, email, no HP, batch..."
        className="h-10 border-white/20 bg-white pl-10 pr-3 text-dark placeholder:text-gray-500 focus-visible:border-[var(--color-gold)]"
      />

      {showDropdown && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[9999] max-h-96 overflow-auto rounded-md border border-gray-200 bg-white text-dark shadow-lg">
          {searchQuery.isFetching && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-bodytext">
              <Icon icon="solar:refresh-linear" height={16} className="animate-spin" />
              Mencari...
            </div>
          )}

          {!searchQuery.isFetching && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-bodytext">Tidak ada hasil</div>
          )}

          {!searchQuery.isFetching &&
            results.map((result) => (
              <Link
                key={result.enrollmentId}
                to={`/admin/batches/${result.batchId}?enrollment=${result.enrollmentId}`}
                className="block border-b border-gray-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-gray-50"
                onClick={() => onChange('')}
              >
                <div className="font-semibold text-dark">
                  {result.pesertaName || result.pesertaEmail || 'Peserta tanpa nama'}
                </div>
                <div className="mt-1 text-xs text-bodytext">
                  {result.batchName || 'Batch tanpa nama'} / {result.tierName || 'Tanpa paket'} /{' '}
                  {formatPaymentStatus(result.paymentStatus)}
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  )
}
