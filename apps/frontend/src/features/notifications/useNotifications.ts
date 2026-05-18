import { useEffect, useState } from 'react'
import api from 'src/api/axios'
import { useUser } from 'src/lib/better-auth'

export interface Notification {
  id: string
  type: 'warning' | 'info' | 'success' | 'error'
  message: string
  actionUrl?: string
  isRead: number
  createdAt: string
}

export const useNotifications = () => {
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications/me'),
        api.get('/notifications/me/unread-count'),
      ])
      setNotifications(notifRes.data)
      setUnreadCount(countRes.data.count)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return

    fetchNotifications()

    // SSE stream disabled temporarily - using polling instead
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds

    return () => {
      clearInterval(interval)
    }
  }, [user])

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: 1 } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/me/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}
