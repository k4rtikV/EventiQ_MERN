const mongoose = require('mongoose');

const newsletterSubscriberSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        isSubscribed: {
            type: Boolean,
            default: true
        },

        promoUsed: {
            type: Boolean,
            default: false
        },

        promoUsedAt: {
            type: Date,
            default: null
        },

        unsubscribedAt: {
            type: Date,
            default: null
        },

        promoUsedBookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    'NewsletterSubscriber',
    newsletterSubscriberSchema
);