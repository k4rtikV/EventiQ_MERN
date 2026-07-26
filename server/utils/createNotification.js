const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotification = async ({
    user,
    type = 'general',
    title,
    message,
    link = '',
    relatedBooking = null,
    relatedEvent = null
}) => {
    if (!user || !title || !message) return null;

    try {
        return await Notification.create({
            user,
            type,
            title,
            message,
            link,
            relatedBooking,
            relatedEvent
        });
    } catch (error) {
        console.error('Notification creation failed:', error.message);
        return null;
    }
};

const createNotificationsForUsers = async ({ users = [], ...notification }) => {
    const uniqueUsers = [...new Set(users.filter(Boolean).map(String))];
    if (!uniqueUsers.length) return [];

    return Promise.all(
        uniqueUsers.map((user) => createNotification({ user, ...notification }))
    );
};

const createAdminNotifications = async (notification) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('_id').lean();
        return createNotificationsForUsers({
            users: admins.map((admin) => admin._id),
            ...notification
        });
    } catch (error) {
        console.error('Admin notification creation failed:', error.message);
        return [];
    }
};

module.exports = createNotification;
module.exports.createNotificationsForUsers = createNotificationsForUsers;
module.exports.createAdminNotifications = createAdminNotifications;
