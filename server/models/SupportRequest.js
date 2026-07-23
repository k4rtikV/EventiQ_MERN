const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
        type: { type: String, enum: ['ticket_delay', 'refund_delay'], required: true },
        status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
        subject: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true, maxlength: 2000 },
        adminNote: { type: String, default: null, trim: true, maxlength: 1000 },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        resolvedAt: { type: Date, default: null },
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    { timestamps: true }
);

supportRequestSchema.index({ booking: 1, type: 1, status: 1 });

module.exports = mongoose.model('SupportRequest', supportRequestSchema);