const Booking = require('../models/Booking');

const {
    generateInvoicePDF,
    getInvoiceNumber
} = require('../utils/generateInvoicePDF');

const downloadInvoice = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('eventId')
            .populate('userId', 'name email');

        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found.'
            });
        }

        const bookingOwnerId =
            booking.userId?._id?.toString();

        const requesterId =
            req.user.id?.toString();

        if (
            bookingOwnerId !== requesterId &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                message:
                    'You are not authorized to download this invoice.'
            });
        }

        if (booking.paymentStatus !== 'paid') {
            return res.status(400).json({
                message:
                    'An invoice is available only after payment is completed.'
            });
        }

        const invoiceBuffer =
            await generateInvoicePDF(booking);

        const invoiceNumber =
            getInvoiceNumber(booking);

        res.setHeader(
            'Content-Type',
            'application/pdf'
        );

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${invoiceNumber}.pdf"`
        );

        res.setHeader(
            'Content-Length',
            invoiceBuffer.length
        );

        return res.send(invoiceBuffer);
    } catch (error) {
        console.error(
            'Invoice download error:',
            error
        );

        return res.status(500).json({
            message:
                'Unable to generate the invoice right now.'
        });
    }
};

module.exports = {
    downloadInvoice
};