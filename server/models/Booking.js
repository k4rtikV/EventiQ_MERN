const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: ['confirmed', 'cancelled', 'pending'], default: 'pending' },
    paymentStatus: { type: String, enum: ['paid', 'not_paid'], default: 'not_paid' },
    amount: { type: Number, required: true },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zip: { type: String },
        country: { type: String },
        phone: { type: String }
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    allowNoAddress: { type: Boolean, default: false },
    bookedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);