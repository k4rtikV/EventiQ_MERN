import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState
} from 'react';
import api from '../utils/axios';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        try {
            const { data } = await api.get('/notifications/unread-count');
            setUnreadCount(Number(data?.count || 0));
        } catch (error) {
            console.error('Unable to load unread notifications:', error);
        }
    }, [user]);

    const fetchNotifications = useCallback(async (limit = 30, unreadOnly = false) => {
        if (!user) {
            setNotifications([]);
            return [];
        }

        try {
            setLoading(true);
            const { data } = await api.get('/notifications', {
                params: {
                    limit,
                    unread: unreadOnly ? 'true' : undefined
                }
            });

            const safeNotifications = Array.isArray(data) ? data : [];
            setNotifications(safeNotifications);
            return safeNotifications;
        } catch (error) {
            console.error('Unable to load notifications:', error);
            return [];
        } finally {
            setLoading(false);
        }
    }, [user]);

    const markAsRead = useCallback(async (notificationId) => {
        try {
            const { data } = await api.patch(`/notifications/${notificationId}/read`);

            setNotifications((current) =>
                current.map((notification) =>
                    notification._id === notificationId
                        ? { ...notification, ...data, isRead: true }
                        : notification
                )
            );

            setUnreadCount((count) => Math.max(0, count - 1));
            return data;
        } catch (error) {
            console.error('Unable to mark notification as read:', error);
            throw error;
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    isRead: true
                }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Unable to mark all notifications as read:', error);
            throw error;
        }
    }, []);

    const removeNotification = useCallback(async (notificationId) => {
        const existing = notifications.find(
            (notification) => notification._id === notificationId
        );

        try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications((current) =>
                current.filter((notification) => notification._id !== notificationId)
            );

            if (existing && !existing.isRead) {
                setUnreadCount((count) => Math.max(0, count - 1));
            }
        } catch (error) {
            console.error('Unable to delete notification:', error);
            throw error;
        }
    }, [notifications]);

    const clearReadNotifications = useCallback(async () => {
        try {
            await api.delete('/notifications/clear-read');
            setNotifications((current) =>
                current.filter((notification) => !notification.isRead)
            );
        } catch (error) {
            console.error('Unable to clear read notifications:', error);
            throw error;
        }
    }, []);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            return undefined;
        }

        fetchUnreadCount();

        const intervalId = window.setInterval(fetchUnreadCount, 30000);
        return () => window.clearInterval(intervalId);
    }, [user, fetchUnreadCount]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                fetchNotifications,
                fetchUnreadCount,
                markAsRead,
                markAllAsRead,
                removeNotification,
                clearReadNotifications
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error('useNotifications must be used inside NotificationProvider');
    }

    return context;
};
