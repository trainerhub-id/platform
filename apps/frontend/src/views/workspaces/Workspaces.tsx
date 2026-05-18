import { Link } from 'react-router'
import { useWorkspaces } from '../../hooks/useWorkspaces'
import { formatWorkspaceLabel } from '../../utils/workspaceLabel'

export default function Workspaces() {
  const { data: workspaces, isLoading } = useWorkspaces()

  if (isLoading) {
    return <div className="p-8 text-sm">Memuat workspace…</div>
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <h1 className="text-xl font-semibold mb-2">Belum ada workspace</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Setelah pembayaran, workspace untuk program yang kamu beli akan otomatis muncul di sini.
        </p>
        <a
          href="https://sertifikasitrainer.com"
          className="inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground"
        >
          Lihat program tersedia →
        </a>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Workspaces saya</h1>
      <div className="space-y-3">
        {workspaces.map((ws) => (
          <div key={ws.id} className="border rounded-md p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{formatWorkspaceLabel(ws)}</div>
              <div className="text-xs text-muted-foreground">
                Status: {ws.status}
                {ws.lastAccessedAt
                  ? ` · Terakhir diakses ${new Date(ws.lastAccessedAt).toLocaleDateString('id-ID')}`
                  : ''}
              </div>
            </div>
            <Link
              to={`/${ws.slug}`}
              className="text-sm font-medium text-primary hover:underline"
              data-testid={`open-workspace-${ws.slug}`}
            >
              Buka →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
