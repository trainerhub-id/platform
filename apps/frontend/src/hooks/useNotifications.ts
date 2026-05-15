import { useState, useEffect } from 'react';
import api from 'src/api/axios';

export interface Notification {
    id: string;
    pesertaId: string;
    type: 'warning' | 'info' | 'success' | 'error';
    message: string;
    actionUrl: string | null;
    isRead: number; // 0 = unread, 1 = read
    createdAt: Date;
}

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications/me');
            setNotifications(response.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/notifications/me/unread-count');
            setUnreadCount(response.data.count);
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await api.patch(`/notifications/${notificationId}/read`);
            // Update local state
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === notificationId ? { ...notif, isRead: 1 } : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/me/read-all');
            setNotifications(prev => prev.map(notif => ({ ...notif, isRead: 1 })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const deleteNotification = async (notificationId: string) => {
        try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
            fetchUnreadCount(); // Refresh unread count
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refetch: fetchNotifications,
    };
};
