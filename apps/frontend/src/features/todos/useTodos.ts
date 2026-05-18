import { useCallback, useEffect, useState } from 'react'
import api from 'src/api/workspace-axios'
import { readCurrentWorkspaceSlug } from 'src/api/workspace-axios'
import { useWorkspaces } from 'src/hooks/useWorkspaces'

export interface TodoItem {
  id: string
  key: string
  title: string
  description?: string
  category: string
  status: 'todo' | 'in_progress' | 'waiting_review' | 'done'
  isBlocking: boolean
  ctaLabel: string
  ctaTarget: string
  completedAt?: string
  meta?: any
}

export const useTodos = (batchId?: string, isAdmin: boolean = false) => {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces()

  const workspaceSlug =
    typeof window === 'undefined'
      ? null
      : (readCurrentWorkspaceSlug(window.location.pathname) ??
        [...(workspaces ?? [])].sort((a, b) => {
          const aTs = new Date(a.lastAccessedAt ?? a.createdAt).getTime()
          const bTs = new Date(b.lastAccessedAt ?? b.createdAt).getTime()
          return bTs - aTs
        })[0]?.slug)

  const fetchTodos = useCallback(async () => {
    try {
      if (!isAdmin && workspacesLoading) return
      if (!isAdmin && !workspaceSlug) {
        setTodos([])
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      let url = '/todos/my'
      if (isAdmin && batchId) {
        url = `/todos/batch/${batchId}/admin`
      } else if (isAdmin && !batchId) {
        url = '/todos/admin/all'
      }

      const res = await api.get(
        url,
        workspaceSlug ? { headers: { 'X-Workspace-Slug': workspaceSlug } } : undefined,
      )

      setTodos(res.data ?? [])
      setError(null)
    } catch (err) {
      console.error('Error fetching todos:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [batchId, isAdmin, workspaceSlug, workspacesLoading])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  return { todos, loading, error, refresh: fetchTodos }
}
