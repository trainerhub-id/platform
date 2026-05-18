import { Navigate } from 'react-router'
import { useUser } from 'src/lib/better-auth'
import { useWorkspaces } from '../hooks/useWorkspaces'

export const RoleBasedRedirect = () => {
  const { user } = useUser()
  const role = user?.publicMetadata?.role || 'peserta'
  if (role === 'admin') return <Navigate to="/admin/home" replace />
  return <PesertaRedirect />
}

function PesertaRedirect() {
  const { data: workspaces, isLoading, isError } = useWorkspaces()
  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Memuat…</div>
  if (isError) return <Navigate to="/auth/login" replace />
  if (!workspaces || workspaces.length === 0) return <Navigate to="/workspaces" replace />
  const sorted = [...workspaces].sort((a, b) => {
    const aTs = new Date(a.lastAccessedAt ?? a.createdAt).getTime()
    const bTs = new Date(b.lastAccessedAt ?? b.createdAt).getTime()
    return bTs - aTs
  })
  return <Navigate to={`/${sorted[0].slug}`} replace />
}
