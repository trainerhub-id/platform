import { Navigate, useLocation } from 'react-router'
import { useWorkspaces } from '../hooks/useWorkspaces'

const PATH_MAP: Record<string, string> = {
  '/user/home': '',
  '/user/training/info': '/training',
  '/user/profile': '/profile',
  '/user/kelas': '/kelas',
  '/user/dokumen': '/dokumen',
  '/user/sertifikat': '/sertifikat',
  '/user/ai-hub': '/ai-hub',
  '/user/ai-hub/master-workspace': '/ai-hub/master-workspace',
  '/user/ai-hub/trainer-workspace': '/ai-hub/trainer-workspace',
  '/user/ai-hub/branding': '/ai-hub/branding',
  '/user/ai-generator': '/ai-hub/trainer-workspace',
  '/user/documents': '/ai-hub/trainer-workspace',
  '/trainer/documents': '/ai-hub/trainer-workspace',
}

export function LegacyUserRedirect() {
  const { pathname } = useLocation()
  const { data: workspaces, isLoading } = useWorkspaces()

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Memuat…</div>

  if (!workspaces || workspaces.length === 0) {
    return <Navigate to="/workspaces" replace />
  }

  const slug = workspaces[0].slug
  const mapped = PATH_MAP[pathname]
  const subPath = mapped !== undefined ? mapped : pathname.replace('/user/', '/')

  return <Navigate to={`/${slug}${subPath}`} replace />
}
