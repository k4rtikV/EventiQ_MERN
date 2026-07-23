const mongoose = require('mongoose');

const newsletterCampaignSchema = new mongoose.Schema(
    {
        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 10000
        },

        recipientCount: {
            type: Number,
            default: 0
        },

        deliveredCount: {
            type: Number,
            default: 0
        },

        failedCount: {
            type: Number,
            default: 0
        },

        sentBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        sentAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    'NewsletterCampaign',
    newsletterCampaignSchema
);
