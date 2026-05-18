import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import api from 'src/api/axios'
import { Button } from 'src/components/ui/button'
import { Loading } from 'src/components/ui/loading'

type ActivityLogPanelProps = {
  batchId: string
}

type ActivityLog = {
  id: string
  action: string
  actorName?: string | null
  actorEmail?: string | null
  createdAt: string
}

const actorLabel = (log: ActivityLog) => log.actorName || log.actorEmail || 'Admin'

const describeAction = (log: ActivityLog) => {
  const actor = actorLabel(log)
  if (log.action === 'batch.published') return `${actor} publish batch`
  if (log.action === 'batch_tier.price_updated') return `${actor} mengubah harga paket`
  if (log.action === 'batch_tier.scalev_synced') return `${actor} sync paket ke Scalev`
  if (log.action === 'document.approved') return `${actor} approve dokumen`
  if (log.action === 'certificate.uploaded') return `${actor} upload sertifikat`
  if (log.action === 'enrollment.payment_paid') return `${actor} menandai pembayaran paid`
  return `${actor} melakukan ${log.action}`
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const ActivityLogPanel = ({ batchId }: ActivityLogPanelProps) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-audit-logs', batchId],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs', { params: { batchId } })
      return (res.data.logs ?? []) as ActivityLog[]
    },
    enabled: Boolean(batchId),
  })

  if (isLoading) return <Loading />

  if (error) {
    return (
      <div className="rounded-md border border-red-100 bg-red-50 p-6 text-center">
        <Icon icon="solar:danger-triangle-linear" height={36} className="mx-auto text-red-500" />
        <h3 className="mt-3 font-bold text-dark">Activity log tidak dapat dimuat</h3>
        <p className="mt-1 text-sm text-bodytext">Coba refresh riwayat aktivitas batch ini.</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4 rounded-xl">
          Refresh
        </Button>
      </div>
    )
  }

  const logs = data ?? []

  return (
    <div className="divide-y divide-gray-100 rounded-md border border-gray-200 bg-white">
      {logs.length > 0 ? (
        logs.map((log) => (
          <div key={log.id} className="flex gap-3 px-4 py-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon icon="solar:history-linear" height={16} />
            </div>
            <div>
              <div className="text-sm font-medium text-dark">{describeAction(log)}</div>
              <div className="mt-1 text-xs text-bodytext">{formatDateTime(log.createdAt)}</div>
            </div>
          </div>
        ))
      ) : (
        <div className="px-4 py-10 text-center">
          <Icon icon="solar:history-linear" height={42} className="mx-auto text-bodytext/50" />
          <p className="mt-2 font-medium text-dark">Belum ada aktivitas</p>
          <p className="mt-1 text-sm text-bodytext">
            Perubahan batch, paket, dokumen, dan sertifikat akan muncul di sini.
          </p>
        </div>
      )}
    </div>
  )
}
