const Booking = require('../models/Booking');
const Event = require('../models/Event');
const OTP = require('../models/OTP');
const { sendBookingEmail, sendOTPEmail, sendCancellationEmail, sendPaymentReceivedEmail } = require('../utils/email');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.sendBookingOTP = async (req, res) => {
    try {
        const otp = generateOTP();
        await OTP.findOneAndDelete({ email: req.user.email, action: 'event_booking' });
        await OTP.create({ email: req.user.email, otp, action: 'event_booking' });
        await sendOTPEmail(req.user.email, otp, 'event_booking');
        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

exports.bookEvent = async (req, res) => {
    try {
        const { eventId, otp } = req.body;

        const validOTP = await OTP.findOne({ email: req.user.email, otp, action: 'event_booking' });
        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP for booking' });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.availableSeats <= 0) return res.status(400).json({ message: 'No seats available' });

        const existingBooking = await Booking.findOne({ userId: req.user.id, eventId });
        if (existingBooking && existingBooking.status !== 'cancelled') {
            return res.status(400).json({ message: 'Already booked or pending, please go to your profile to manage your bookings' });
        }

        const booking = await Booking.create({
            userId: req.user.id,
            eventId,
            status: 'pending',
            paymentStatus: 'not_paid',
            amount: event.ticketPrice
        });

        await OTP.deleteOne({ _id: validOTP._id });

        res.status(201).json({ message: 'Booking request submitted', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('eventId').populate('userId', 'name email');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this booking' });
        }
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.updateBookingAddress = async (req, res) => {
    try {
        const { street, city, state, zip, country, phone } = req.body;
        const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.address = { street, city, state, zip, country, phone };
        await booking.save();

        res.json({ message: 'Address saved successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id }).populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.paymentStatus === 'paid') return res.status(400).json({ message: 'Payment already completed for this booking' });
        // allow certain bookings (created via repurchase) to proceed without an address
        if (!booking.address || !booking.address.street) {
            if (!booking.allowNoAddress) {
                return res.status(400).json({ message: 'Please save your address before proceeding to payment' });
            }
        }

        const event = booking.eventId;
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const amountInPaise = Math.round((event.ticketPrice || 0) * 100);
        if (amountInPaise === 0) {
            booking.paymentStatus = 'paid';
            await booking.save();
            return res.json({ free: true, booking });
        }

        const order = await razorpayInstance.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_${booking._id}`,
            payment_capture: 1
        });

        booking.razorpayOrderId = order.id;
        await booking.save();

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
            bookingId: booking._id,
            eventTitle: event.title
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id }).populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (!booking.razorpayOrderId || booking.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({ message: 'Booking order mismatch' });
        }

        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        booking.paymentStatus = 'paid';
        booking.razorpayPaymentId = razorpay_payment_id;
        await booking.save();

        // send payment received email to user
        try {
            await sendPaymentReceivedEmail(req.user.email, req.user.name, booking.eventId.title, booking._id, booking.amount);
        } catch (emailErr) {
            console.error('Failed to send payment received email:', emailErr);
        }

        res.json({ message: 'Payment verified successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.confirmBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('userId').populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'confirmed') {
            return res.status(400).json({ message: 'Booking is already confirmed' });
        }

        if (booking.paymentStatus !== 'paid') {
            return res.status(400).json({ message: 'Cannot verify booking without completed payment' });
        }

        const event = await Event.findById(booking.eventId._id);
        if (event.availableSeats <= 0) {
            return res.status(400).json({ message: 'No seats available to confirm this booking' });
        }

        booking.status = 'confirmed';
        await booking.save();

        event.availableSeats -= 1;
        await event.save();

        await sendBookingEmail(booking.userId.email, booking.userId.name, booking.eventId.title, booking);

        res.json({ message: 'Booking verified successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = req.user.role === 'admin'
            ? await Booking.find().populate('eventId').populate('userId', 'name email').sort({ createdAt: -1 })
            : await Booking.find({ userId: req.user.id }).populate('eventId').sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

        const wasConfirmed = booking.status === 'confirmed';
        const cancelledByAdmin = req.user.role === 'admin' && booking.userId.toString() !== req.user.id;

        booking.status = 'cancelled';
        await booking.save();

        if (wasConfirmed) {
            const event = await Event.findById(booking.eventId);
            if (event) {
                event.availableSeats += 1;
                await event.save();
            }
        }

        try {
            const bookingUser = await Booking.findById(booking._id).populate('userId', 'name email').populate('eventId', 'title');
            if (bookingUser && bookingUser.userId && bookingUser.eventId) {
                await sendCancellationEmail(
                    bookingUser.userId.email,
                    bookingUser.userId.name,
                    bookingUser.eventId.title,
                    bookingUser.amount,
                    cancelledByAdmin
                );
            }
        } catch (emailError) {
            console.error('Cancellation notification failed:', emailError);
        }

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.repurchaseBooking = async (req, res) => {
    try {
        const original = await Booking.findById(req.params.id).populate('eventId');
        if (!original) return res.status(404).json({ message: 'Original booking not found' });
        if (original.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to repurchase' });
        }

        const event = original.eventId;
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.availableSeats <= 0) return res.status(400).json({ message: 'No seats available' });

        const booking = await Booking.create({
            userId: req.user.id,
            eventId: event._id,
            status: 'pending',
            paymentStatus: 'not_paid',
            amount: event.ticketPrice,
            allowNoAddress: true
        });

        res.status(201).json({ message: 'Repurchase booking created', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};