import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaBell,
    FaCalendarAlt,
    FaCheck,
    FaCreditCard,
    FaHeadset,
    FaTicketAlt,
    FaTimes,
    FaTimesCircle,
    FaTrash,
    FaUndoAlt
} from 'react-icons/fa';
import { useNotifications } from '../context/NotificationContext';

const iconByType = {
    booking: FaCalendarAlt,
    payment: FaCreditCard,
    ticket: FaTicketAlt,
    cancellation: FaTimesCircle,
    refund: FaUndoAlt,
    support: FaHeadset,
    event: FaCalendarAlt,
    general: FaBell
};

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearReadNotifications
    } = useNotifications();

    useEffect(() => {
        fetchNotifications(30);
    }, [fetchNotifications]);

    const visibleNotifications = useMemo(() => {
        if (filter === 'unread') {
            return notifications.filter((notification) => !notification.isRead);
        }

        return notifications;
    }, [notifications, filter]);

    const handleOpen = async (notification) => {
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }

        if (notification.link) {
            navigate(notification.link);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-3xl shadow-xl dark:shadow-black/30 overflow-hidden">
                <div className="px-6 md:px-10 py-8 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white dark:bg-white/10 dark:text-gray-100 dark:border dark:border-white/10 dark:shadow-inner flex items-center justify-center text-xl">
                                    <FaBell />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                                        Notification Centre
                                    </h1>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                                        Booking, ticket, refund and support updates in one place.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-gray-100 font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/10 dark:hover:border-white/20 transition-all duration-200"
                                >
                                    <FaCheck />
                                    Mark all read
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={clearReadNotifications}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-white/10 dark:hover:bg-white/15 dark:border dark:border-white/10 dark:hover:border-white/20 font-bold text-sm transition-all duration-200"
                            >
                                <FaTrash />
                                Clear read
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-7">
                        <button
                            type="button"
                            onClick={() => setFilter('all')}
                            className={`px-5 py-2.5 rounded-xl border border-transparent font-bold text-sm transition-all duration-200 ${
                                filter === 'all'
                                    ? 'bg-gray-900 text-white shadow-sm dark:bg-white/[0.88] dark:text-slate-900 dark:shadow-lg dark:shadow-black/20 dark:border dark:border-white/30'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:border dark:border-white/5'
                            }`}
                        >
                            All ({notifications.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setFilter('unread')}
                            className={`px-5 py-2.5 rounded-xl border border-transparent font-bold text-sm transition-all duration-200 ${
                                filter === 'unread'
                                    ? 'bg-gray-900 text-white shadow-sm dark:bg-white/[0.88] dark:text-slate-900 dark:shadow-lg dark:shadow-black/20 dark:border dark:border-white/30'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:border dark:border-white/5'
                            }`}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {loading ? (
                        <div className="py-20 text-center text-gray-500 font-semibold dark:text-gray-400">
                            Loading notifications...
                        </div>
                    ) : visibleNotifications.length === 0 ? (
                        <div className="py-20 px-6 text-center">
                            <FaBell className="mx-auto text-5xl text-gray-300 dark:text-gray-500 mb-5" />
                            <h2 className="text-xl font-black text-gray-800 dark:text-white">
                                {filter === 'unread' ? 'You are all caught up' : 'No notifications yet'}
                            </h2>
                            <p className="text-gray-500 mt-2 dark:text-gray-400">
                                New booking and account updates will appear here.
                            </p>
                        </div>
                    ) : (
                        visibleNotifications.map((notification) => {
                            const Icon = iconByType[notification.type] || FaBell;

                            return (
                                <div
                                    key={notification._id}
                                    className={`p-6 md:px-10 flex items-start gap-4 ${
                                        notification.isRead
                                            ? 'bg-white dark:bg-slate-900'
                                            : 'bg-gray-50 dark:bg-slate-800/80'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleOpen(notification)}
                                        className="flex items-start gap-4 flex-1 text-left min-w-0"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white dark:bg-white/10 dark:text-gray-100 dark:border dark:border-white/10 flex items-center justify-center shrink-0">
                                            <Icon />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3">
                                                <h2 className="font-black text-gray-900 dark:text-white">
                                                    {notification.title}
                                                </h2>
                                                {!notification.isRead && (
                                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-900 dark:bg-blue-400 dark:shadow-[0_0_8px_rgba(96,165,250,0.7)] shrink-0" />
                                                )}
                                            </div>

                                            <p className="text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">
                                                {notification.message}
                                            </p>

                                            <p className="text-xs font-semibold text-gray-400 mt-3">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </button>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {!notification.isRead && (
                                            <button
                                                type="button"
                                                onClick={() => markAsRead(notification._id)}
                                                title="Mark as read"
                                                className="w-9 h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:hover:border-white/20 inline-flex items-center justify-center transition-all duration-200"
                                            >
                                                <FaCheck />
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => removeNotification(notification._id)}
                                            title="Delete notification"
                                            className="w-9 h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-500/15 dark:hover:text-red-400 dark:hover:border-red-500/30 inline-flex items-center justify-center transition-all duration-200"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;