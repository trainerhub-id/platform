import api from './axios'

export type Workspace = {
  id: string
  slug: string
  userId: string
  pesertaId: string
  enrollmentId: string
  batchId: string
  courseId: string
  displayName: string
  status: 'active' | 'archived' | 'suspended'
  lastAccessedAt: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const res = await api.get<Workspace[]>('/workspaces')
  return res.data
}

export async function fetchWorkspaceBySlug(slug: string): Promise<Workspace | null> {
  try {
    const res = await api.get<Workspace>(`/workspaces/by-slug/${slug}`)
    return res.data
  } catch (err: any) {
    if (err?.response?.status === 404) return null
    throw err
  }
}
