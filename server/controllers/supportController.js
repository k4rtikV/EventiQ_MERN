const nodemailer = require('nodemailer');
const Booking = require('../models/Booking');
const SupportRequest = require('../models/SupportRequest');
const { sendSupportEmail } = require('../utils/email');
const { generateInvoicePDF, getInvoiceNumber } = require('../utils/generateInvoicePDF');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const supportRequest = async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Name, email, and message are required.' });
    }
    try {
        await sendSupportEmail(name, email, message);
        return res.status(200).json({ message: 'Support query sent successfully.' });
    } catch (error) {
        console.error('Support email error:', error);
        return res.status(500).json({ message: 'Failed to send support query. Please try again later.' });
    }
};

const createDelayedRequest = async ({ req, res, type }) => {
    const message = String(req.body.message || '').trim();
    if (!message) return res.status(400).json({ message: 'A message is required.' });
    if (message.length > 2000) return res.status(400).json({ message: 'Message cannot exceed 2,000 characters.' });

    const booking = await Booking.findById(req.params.bookingId)
        .populate('eventId')
        .populate('userId', 'name email');

    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (booking.userId?._id?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You are not authorized to submit support for this booking.' });
    }

    const isTicket = type === 'ticket_delay';
    const eligible = isTicket
        ? booking.paymentStatus === 'paid' && booking.status === 'pending'
        : booking.paymentStatus === 'paid' && booking.status === 'cancelled' && (!booking.refund?.status || booking.refund.status === 'not_started');

    if (!eligible) {
        return res.status(400).json({
            message: isTicket
                ? 'Ticket-delay support is available only for paid bookings awaiting approval.'
                : 'Refund-delay support is available only for cancelled paid bookings awaiting refund initiation.'
        });
    }

    const duplicate = await SupportRequest.findOne({
        user: req.user._id,
        booking: booking._id,
        type,
        status: { $in: ['open', 'in_progress'] }
    });
    if (duplicate) {
        return res.status(409).json({ message: 'A support request is already open for this booking.' });
    }

    const subject = isTicket
        ? `Ticket assignment delay - ${booking.eventId?.title || 'Event'}`
        : `Refund initiation delay - ${booking.eventId?.title || 'Event'}`;

    const request = await SupportRequest.create({
        user: req.user._id,
        booking: booking._id,
        type,
        subject,
        message
    });

    try {
        const invoiceBuffer = await generateInvoicePDF(booking);
        const invoiceNumber = getInvoiceNumber(booking);
        const supportRecipient = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: supportRecipient,
            replyTo: booking.userId.email,
            subject: `${subject} - ${booking._id}`,
            html: `
                <div style="font-family:Arial,sans-serif;line-height:1.6;padding:20px;color:#111827">
                    <h2>${isTicket ? 'Ticket Assignment Delay Request' : 'Refund Initiation Delay Request'}</h2>
                    <p><strong>Name:</strong> ${escapeHtml(booking.userId.name)}</p>
                    <p><strong>Email:</strong> ${escapeHtml(booking.userId.email)}</p>
                    <p><strong>Event:</strong> ${escapeHtml(booking.eventId?.title || 'N/A')}</p>
                    <p><strong>Booking ID:</strong> ${escapeHtml(booking._id)}</p>
                    <p><strong>Payment ID:</strong> ${escapeHtml(booking.razorpayPaymentId || 'Not available')}</p>
                    <p><strong>Invoice:</strong> ${escapeHtml(invoiceNumber)}</p>
                    <p><strong>Amount paid:</strong> INR ${Number(booking.amount || 0).toFixed(2)}</p>
                    <p><strong>Current status:</strong> ${isTicket ? 'Paid - Pending approval' : 'Cancelled - Awaiting refund initiation'}</p>
                    <p><strong>Customer message:</strong></p>
                    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
                </div>`,
            attachments: [{ filename: `${invoiceNumber}.pdf`, content: invoiceBuffer, contentType: 'application/pdf' }]
        });
    } catch (emailError) {
        console.error('Delayed support email error:', emailError);
        await SupportRequest.findByIdAndDelete(request._id);
        return res.status(502).json({ message: 'Unable to send the support request email right now. Please try again.' });
    }

    return res.status(201).json({
        message: isTicket
            ? 'Your ticket-delay request was sent successfully.'
            : 'Your refund initiation-delay request was sent successfully.',
        request
    });
};

const ticketDelaySupportRequest = async (req, res) => {
    try { return await createDelayedRequest({ req, res, type: 'ticket_delay' }); }
    catch (error) { console.error('Ticket delay support error:', error); return res.status(500).json({ message: 'Unable to send the ticket-delay request right now.' }); }
};

const refundDelaySupportRequest = async (req, res) => {
    try { return await createDelayedRequest({ req, res, type: 'refund_delay' }); }
    catch (error) { console.error('Refund delay support error:', error); return res.status(500).json({ message: 'Unable to send the refund initiation-delay request right now.' }); }
};

const getAdminDelayedRequests = async (req, res) => {
    try {
        const filter = {};
        if (req.query.type && ['ticket_delay', 'refund_delay'].includes(req.query.type)) filter.type = req.query.type;
        if (req.query.status && ['open', 'in_progress', 'resolved', 'closed'].includes(req.query.status)) filter.status = req.query.status;

        const requests = await SupportRequest.find(filter)
            .populate('user', 'name email')
            .populate({
                path: 'booking',
                populate: [
                    { path: 'eventId', select: 'title date location availableSeats totalSeats' },
                    { path: 'userId', select: 'name email' }
                ]
            })
            .populate('assignedTo', 'name email')
            .populate('resolvedBy', 'name email')
            .sort({ status: 1, createdAt: -1 });
        return res.json(requests);
    } catch (error) {
        console.error('Get delayed requests error:', error);
        return res.status(500).json({ message: 'Unable to load delayed support requests.' });
    }
};

const updateDelayedRequest = async (req, res) => {
    try {
        const request = await SupportRequest.findById(req.params.requestId);
        if (!request) return res.status(404).json({ message: 'Support request not found.' });

        const status = req.body.status;
        const adminNote = req.body.adminNote == null ? request.adminNote : String(req.body.adminNote).trim();
        if (status && !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid support request status.' });
        }
        if (adminNote && adminNote.length > 1000) return res.status(400).json({ message: 'Admin note cannot exceed 1,000 characters.' });

        if (status) request.status = status;
        request.adminNote = adminNote || null;
        if (request.status === 'in_progress') request.assignedTo = req.user._id;
        if (['resolved', 'closed'].includes(request.status)) {
            request.resolvedAt = request.resolvedAt || new Date();
            request.resolvedBy = req.user._id;
        } else {
            request.resolvedAt = null;
            request.resolvedBy = null;
        }
        await request.save();
        const populated = await SupportRequest.findById(request._id)
            .populate('user', 'name email')
            .populate({ path: 'booking', populate: [{ path: 'eventId' }, { path: 'userId', select: 'name email' }] })
            .populate('assignedTo', 'name email').populate('resolvedBy', 'name email');
        return res.json({ message: 'Support request updated successfully.', request: populated });
    } catch (error) {
        console.error('Update delayed request error:', error);
        return res.status(500).json({ message: 'Unable to update the support request.' });
    }
};

module.exports = {
    supportRequest,
    ticketDelaySupportRequest,
    refundDelaySupportRequest,
    getAdminDelayedRequests,
    updateDelayedRequest
};
