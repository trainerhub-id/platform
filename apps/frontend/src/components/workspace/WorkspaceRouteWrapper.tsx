import { Navigate, Outlet, useParams } from 'react-router'
import { useCurrentWorkspace } from '../../hooks/useCurrentWorkspace'
import { WorkspaceProvider } from '../../context/WorkspaceContext'

export function WorkspaceRouteWrapper() {
  const result = useCurrentWorkspace()
  const params = useParams()

  if (result.status === 'loading') {
    return <div className="p-8 text-sm text-muted-foreground">Memuat workspace…</div>
  }

  if (result.status === 'unauthenticated') {
    return <Navigate to="/auth/login" replace />
  }

  if (result.status === 'no-workspaces') {
    return <Navigate to="/workspaces" replace />
  }

  if (result.status === 'mismatch') {
    // Keep sub-path after the slug if present
    const subPath = window.location.pathname.split('/').slice(2).join('/')
    const target = subPath ? `/${result.defaultSlug}/${subPath}` : `/${result.defaultSlug}`
    return <Navigate to={target} replace />
  }

  return (
    <WorkspaceProvider workspace={result.workspace}>
      <Outlet />
    </WorkspaceProvider>
  )
}
