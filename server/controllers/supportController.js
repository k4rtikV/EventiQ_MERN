const nodemailer = require('nodemailer');

const Booking = require('../models/Booking');

const {
    sendSupportEmail
} = require('../utils/email');

const {
    generateInvoicePDF,
    getInvoiceNumber
} = require('../utils/generateInvoicePDF');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const escapeHtml = (value = '') =>
    String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

const supportRequest = async (req, res) => {
    const {
        name,
        email,
        message
    } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({
            message:
                'Name, email, and message are required.'
        });
    }

    try {
        await sendSupportEmail(
            name,
            email,
            message
        );

        return res.status(200).json({
            message:
                'Support query sent successfully.'
        });
    } catch (error) {
        console.error(
            'Support email error:',
            error
        );

        return res.status(500).json({
            message:
                'Failed to send support query. Please try again later.'
        });
    }
};

const ticketDelaySupportRequest = async (
    req,
    res
) => {
    try {
        const { message } = req.body;

        if (!message?.trim()) {
            return res.status(400).json({
                message: 'A message is required.'
            });
        }

        const booking = await Booking.findById(
            req.params.bookingId
        )
            .populate('eventId')
            .populate(
                'userId',
                'name email'
            );

        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found.'
            });
        }

        if (
            booking.userId?._id?.toString() !==
            req.user.id?.toString()
        ) {
            return res.status(403).json({
                message:
                    'You are not authorized to submit support for this booking.'
            });
        }

        if (
            booking.paymentStatus !== 'paid' ||
            booking.status !== 'pending'
        ) {
            return res.status(400).json({
                message:
                    'Ticket-delay support is available only for paid bookings awaiting approval.'
            });
        }

        const invoiceBuffer =
            await generateInvoicePDF(booking);

        const invoiceNumber =
            getInvoiceNumber(booking);

        const supportRecipient =
            process.env.SUPPORT_EMAIL ||
            process.env.EMAIL_USER;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: supportRecipient,
            replyTo: booking.userId.email,
            subject:
                `Ticket assignment delay - ${
                    booking.eventId?.title ||
                    'Event'
                } - ${booking._id}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; color: #111827;">
                    <h2>Ticket Assignment Delay Request</h2>

                    <p>
                        <strong>Name:</strong>
                        ${escapeHtml(booking.userId.name)}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${escapeHtml(booking.userId.email)}
                    </p>

                    <p>
                        <strong>Event:</strong>
                        ${escapeHtml(
                            booking.eventId?.title ||
                            'N/A'
                        )}
                    </p>

                    <p>
                        <strong>Booking ID:</strong>
                        ${escapeHtml(booking._id)}
                    </p>

                    <p>
                        <strong>Payment ID:</strong>
                        ${escapeHtml(
                            booking.razorpayPaymentId ||
                            'Free booking / not applicable'
                        )}
                    </p>

                    <p>
                        <strong>Invoice:</strong>
                        ${escapeHtml(invoiceNumber)}
                    </p>

                    <p>
                        <strong>Amount paid:</strong>
                        INR ${Number(
                            booking.amount || 0
                        ).toFixed(2)}
                    </p>

                    <p>
                        <strong>Current status:</strong>
                        Paid - Pending approval
                    </p>

                    <p>
                        <strong>Customer message:</strong>
                    </p>

                    <p style="white-space: pre-wrap;">
                        ${escapeHtml(message)}
                    </p>
                </div>
            `,
            attachments: [
                {
                    filename:
                        `${invoiceNumber}.pdf`,
                    content: invoiceBuffer,
                    contentType:
                        'application/pdf'
                }
            ]
        });

        return res.status(200).json({
            message:
                'Your ticket-delay request was sent successfully.'
        });
    } catch (error) {
        console.error(
            'Ticket delay support error:',
            error
        );

        return res.status(500).json({
            message:
                'Unable to send the ticket-delay request right now.'
        });
    }
};


const refundDelaySupportRequest = async (
    req,
    res
) => {
    try {
        const { message } = req.body;

        if (!message?.trim()) {
            return res.status(400).json({
                message: 'A message is required.'
            });
        }

        const booking = await Booking.findById(
            req.params.bookingId
        )
            .populate('eventId')
            .populate(
                'userId',
                'name email'
            );

        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found.'
            });
        }

        if (
            booking.userId?._id?.toString() !==
            req.user.id?.toString()
        ) {
            return res.status(403).json({
                message:
                    'You are not authorized to submit support for this booking.'
            });
        }

        if (
            booking.paymentStatus !== 'paid' ||
            booking.status !== 'cancelled' ||
            booking.refund?.status === 'initiated'
        ) {
            return res.status(400).json({
                message:
                    'Refund-delay support is available only for cancelled paid bookings that are still awaiting refund initiation.'
            });
        }

        const invoiceBuffer =
            await generateInvoicePDF(booking);

        const invoiceNumber =
            getInvoiceNumber(booking);

        const supportRecipient =
            process.env.SUPPORT_EMAIL ||
            process.env.EMAIL_USER;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: supportRecipient,
            replyTo: booking.userId.email,
            subject:
                `Refund initiation delay - ${
                    booking.eventId?.title ||
                    'Event'
                } - ${booking._id}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; color: #111827;">
                    <h2>Refund Initiation Delay Support Request</h2>
                    <p><strong>Name:</strong> ${escapeHtml(booking.userId.name)}</p>
                    <p><strong>Email:</strong> ${escapeHtml(booking.userId.email)}</p>
                    <p><strong>Event:</strong> ${escapeHtml(booking.eventId?.title || 'N/A')}</p>
                    <p><strong>Booking ID:</strong> ${escapeHtml(booking._id)}</p>
                    <p><strong>Payment ID:</strong> ${escapeHtml(booking.razorpayPaymentId || 'Free booking / not applicable')}</p>
                    <p><strong>Invoice:</strong> ${escapeHtml(invoiceNumber)}</p>
                    <p><strong>Amount paid:</strong> INR ${Number(booking.amount || 0).toFixed(2)}</p>
                    <p><strong>Expected refund amount:</strong> INR ${Number(booking.amount || 0).toFixed(2)}</p>
                    <p><strong>Current status:</strong> Cancelled - Awaiting refund initiation</p>
                    <p><strong>Customer message:</strong></p>
                    <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
                </div>
            `,
            attachments: [
                {
                    filename: `${invoiceNumber}.pdf`,
                    content: invoiceBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });

        return res.status(200).json({
            message:
                'Your refund initiation-delay request was sent successfully.'
        });
    } catch (error) {
        console.error(
            'Refund delay support error:',
            error
        );

        return res.status(500).json({
            message:
                'Unable to send the refund initiation-delay request right now.'
        });
    }
};

module.exports = {
    supportRequest,
    ticketDelaySupportRequest,
    refundDelaySupportRequest
};