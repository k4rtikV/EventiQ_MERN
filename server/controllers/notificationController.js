const mongoose = require('mongoose');
const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        const requestedLimit = Number(req.query.limit);
        const limit = Number.isInteger(requestedLimit)
            ? Math.min(Math.max(requestedLimit, 1), 50)
            : 30;

        const filter = { user: req.user._id };

        if (req.query.unread === 'true') {
            filter.isRead = false;
        }

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        return res.status(500).json({ message: 'Unable to load notifications.' });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user._id,
            isRead: false
        });

        return res.json({ count });
    } catch (error) {
        console.error('Get unread notification count error:', error);
        return res.status(500).json({ message: 'Unable to load the unread notification count.' });
    }
};

exports.markNotificationAsRead = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid notification ID.' });
        }

        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user._id
            },
            {
                $set: { isRead: true }
            },
            {
                new: true
            }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found.' });
        }

        return res.json(notification);
    } catch (error) {
        console.error('Mark notification as read error:', error);
        return res.status(500).json({ message: 'Unable to update the notification.' });
    }
};

exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            {
                user: req.user._id,
                isRead: false
            },
            {
                $set: { isRead: true }
            }
        );

        return res.json({
            message: 'All notifications marked as read.',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        return res.status(500).json({ message: 'Unable to update notifications.' });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid notification ID.' });
        }

        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found.' });
        }

        return res.json({ message: 'Notification deleted.' });
    } catch (error) {
        console.error('Delete notification error:', error);
        return res.status(500).json({ message: 'Unable to delete the notification.' });
    }
};

exports.clearReadNotifications = async (req, res) => {
    try {
        const result = await Notification.deleteMany({
            user: req.user._id,
            isRead: true
        });

        return res.json({
            message: 'Read notifications cleared.',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Clear read notifications error:', error);
        return res.status(500).json({ message: 'Unable to clear notifications.' });
    }
};
