const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: [
                'booking',
                'payment',
                'ticket',
                'cancellation',
                'refund',
                'support',
                'event',
                'general'
            ],
            default: 'general'
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        link: {
            type: String,
            default: '',
            trim: true
        },
        relatedBooking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            default: null
        },
        relatedEvent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            default: null
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
