import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaBell,
    FaCalendarAlt,
    FaCheck,
    FaCreditCard,
    FaHeadset,
    FaTicketAlt,
    FaTimesCircle,
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

const formatTimeAgo = (value) => {
    const createdAt = new Date(value);

    if (Number.isNaN(createdAt.getTime())) {
        return '';
    }

    const seconds = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 1000));

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return createdAt.toLocaleDateString();
};

const NotificationBell = () => {
    const navigate = useNavigate();
    const panelRef = useRef(null);
    const closeTimerRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [panelVisible, setPanelVisible] = useState(false);

    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    } = useNotifications();

    const closePanel = () => {
        setPanelVisible(false);

        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = window.setTimeout(() => {
            setOpen(false);
        }, 150);
    };

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                closePanel();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            window.clearTimeout(closeTimerRef.current);
        };
    }, []);

    const togglePanel = async () => {
        if (open) {
            closePanel();
            return;
        }

        window.clearTimeout(closeTimerRef.current);
        setOpen(true);

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                setPanelVisible(true);
            });
        });

        await fetchNotifications(5);
    };

    const openNotification = async (notification) => {
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }

        closePanel();

        if (notification.link) {
            window.setTimeout(() => {
                navigate(notification.link);
            }, 150);
        }
    };

    const handleViewAll = () => {
        closePanel();

        window.setTimeout(() => {
            navigate('/notifications');
        }, 150);
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                type="button"
                onClick={togglePanel}
                aria-label={open ? 'Close notifications' : 'Open notifications'}
                aria-expanded={open}
                title="Notifications"
                className={[
                    'relative w-10 h-10 rounded-xl',
                    'border border-white/10',
                    'bg-white/5 hover:bg-white/10',
                    'hover:border-white/20',
                    'text-white inline-flex items-center justify-center',
                    'transition-all duration-200 ease-out',
                    'hover:-translate-y-0.5',
                    'hover:shadow-md hover:shadow-black/15',
                    'focus:outline-none focus-visible:ring-2',
                    'focus-visible:ring-blue-400 focus-visible:ring-offset-2',
                    'focus-visible:ring-offset-gray-900',
                    open
                        ? 'bg-white/10 border-white/20'
                        : ''
                ].join(' ')}
            >
                <FaBell />

                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-black inline-flex items-center justify-center border-2 border-gray-900 shadow-md shadow-red-950/30">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className={[
                        'absolute right-0 mt-3 w-[min(92vw,380px)]',
                        'bg-white dark:bg-gray-900',
                        'border border-gray-200 dark:border-gray-700',
                        'rounded-2xl shadow-2xl overflow-hidden z-50 text-left',
                        'origin-top-right transform-gpu',
                        'transition-all duration-150 ease-out',
                        panelVisible
                            ? 'opacity-100 scale-100 translate-y-0'
                            : 'pointer-events-none opacity-0 scale-95 translate-y-2'
                    ].join(' ')}
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h3 className="font-black text-gray-900 dark:text-white">
                                Notifications
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {unreadCount} unread
                            </p>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllAsRead}
                                className="text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white inline-flex items-center gap-1.5 transition-colors"
                            >
                                <FaCheck />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[420px] overflow-y-auto">
                        {loading ? (
                            <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                Loading notifications...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                                <FaBell className="mx-auto text-3xl text-gray-300 mb-3" />
                                <p className="font-bold text-gray-700 dark:text-gray-200">
                                    No notifications yet
                                </p>
                                <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                                    Booking and refund updates will appear here.
                                </p>
                            </div>
                        ) : (
                            notifications.slice(0, 5).map((notification) => {
                                const Icon = iconByType[notification.type] || FaBell;

                                return (
                                    <button
                                        type="button"
                                        key={notification._id}
                                        onClick={() => openNotification(notification)}
                                        className={`w-full px-5 py-4 flex items-start gap-3 border-b border-gray-100 dark:border-gray-800 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                            notification.isRead
                                                ? 'bg-white dark:bg-gray-900'
                                                : 'bg-gray-100 dark:bg-gray-800/70'
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center shrink-0">
                                            <Icon />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="font-bold text-sm text-gray-900 dark:text-white">
                                                    {notification.title}
                                                </p>
                                                {!notification.isRead && (
                                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-900 dark:bg-white shrink-0 mt-1" />
                                                )}
                                            </div>

                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                                                {notification.message}
                                            </p>

                                            <p className="text-xs text-gray-400 mt-2">
                                                {formatTimeAgo(notification.createdAt)}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleViewAll}
                        className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-bold text-sm transition"
                    >
                        View all notifications
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;