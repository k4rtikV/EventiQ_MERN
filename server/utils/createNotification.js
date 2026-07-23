const Notification = require('../models/Notification');

const createNotification = async ({
    user,
    type = 'general',
    title,
    message,
    link = '',
    relatedBooking = null,
    relatedEvent = null
}) => {
    if (!user || !title || !message) {
        return null;
    }

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

module.exports = createNotification;
