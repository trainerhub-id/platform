import { useCallback, useEffect, useState } from 'react'
import api from 'src/api/axios'

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

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true)
      let url = '/todos/my'
      if (isAdmin && batchId) {
        url = `/todos/batch/${batchId}/admin`
      } else if (isAdmin && !batchId) {
        url = '/todos/admin/all'
      }

      const res = await api.get(url)

      setTodos(res.data ?? [])
      setError(null)
    } catch (err) {
      console.error('Error fetching todos:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [batchId, isAdmin])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  return { todos, loading, error, refresh: fetchTodos }
}
