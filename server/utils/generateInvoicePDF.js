const PDFDocument = require('pdfkit');

const formatDate = (value) => {
    if (!value) return 'N/A';

    return new Date(value).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
};

const formatAmount = (value) =>
    Number(value || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

const getInvoiceNumber = (booking) => {
    const year = new Date(
        booking.bookedAt || booking.createdAt || Date.now()
    ).getFullYear();

    return `INV-${year}-${booking._id
        .toString()
        .slice(-8)
        .toUpperCase()}`;
};

const generateInvoicePDF = (booking) =>
    new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50
            });

            const chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const event = booking.eventId || {};
            const user = booking.userId || {};
            const invoiceNumber = getInvoiceNumber(booking);

            doc.fontSize(28)
                .fillColor('#111827')
                .text('EventiQ', { align: 'left' });

            doc.fontSize(18)
                .fillColor('#374151')
                .text('PAYMENT INVOICE', { align: 'right' });

            doc.moveDown(1.5);

            doc.moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .strokeColor('#d1d5db')
                .stroke();

            doc.moveDown();

            const detailsTop = doc.y;

            doc.fontSize(10)
                .fillColor('#6b7280')
                .text('INVOICE NUMBER', 50, detailsTop)
                .fillColor('#111827')
                .fontSize(12)
                .text(invoiceNumber, 50, detailsTop + 16);

            doc.fontSize(10)
                .fillColor('#6b7280')
                .text('ISSUED ON', 325, detailsTop)
                .fillColor('#111827')
                .fontSize(12)
                .text(
                    formatDate(booking.bookedAt || booking.createdAt),
                    325,
                    detailsTop + 16,
                    {
                        width: 220,
                        align: 'right'
                    }
                );

            doc.y = detailsTop + 55;
            doc.moveDown();

            doc.fontSize(13)
                .fillColor('#111827')
                .text('Billed To');

            doc.fontSize(11)
                .fillColor('#374151')
                .text(user.name || 'EventiQ customer')
                .text(user.email || 'N/A');

            doc.moveDown(1.2);

            doc.fontSize(13)
                .fillColor('#111827')
                .text('Booking Details');

            doc.fontSize(11)
                .fillColor('#374151')
                .text(`Booking ID: ${booking._id}`)
                .text(
                    `Payment ID: ${
                        booking.razorpayPaymentId ||
                        'Free booking / not applicable'
                    }`
                )
                .text('Payment status: PAID')
                .text(
                    `Booking status: ${String(
                        booking.status
                    ).toUpperCase()}`
                );

            doc.moveDown(1.5);

            const tableTop = doc.y;

            doc.rect(50, tableTop, 495, 32).fill('#111827');

            doc.fillColor('#ffffff')
                .fontSize(11)
                .text('Event', 65, tableTop + 10, {
                    width: 250
                })
                .text('Qty', 325, tableTop + 10, {
                    width: 50,
                    align: 'center'
                })
                .text('Amount', 405, tableTop + 10, {
                    width: 125,
                    align: 'right'
                });

            const rowTop = tableTop + 32;

            doc.rect(50, rowTop, 495, 62).fill('#f9fafb');

            doc.fillColor('#111827')
                .fontSize(11)
                .text(event.title || 'Event booking', 65, rowTop + 12, {
                    width: 250
                })
                .fontSize(9)
                .fillColor('#6b7280')
                .text(
                    `${formatDate(event.date)}${
                        event.location
                            ? ` | ${event.location}`
                            : ''
                    }`,
                    65,
                    rowTop + 31,
                    {
                        width: 250
                    }
                );

            doc.fillColor('#111827')
                .fontSize(11)
                .text(String(Number(booking.quantity || 1)), 325, rowTop + 22, {
                    width: 50,
                    align: 'center'
                })
                .text(
                    `INR ${formatAmount(
                        booking.originalAmount ?? booking.amount
                    )}`,
                    405,
                    rowTop + 22,
                    {
                        width: 125,
                        align: 'right'
                    }
                );

            let totalY = rowTop + 85;

            const addTotalRow = (
                label,
                amount,
                bold = false
            ) => {
                doc.font(
                    bold
                        ? 'Helvetica-Bold'
                        : 'Helvetica'
                )
                    .fontSize(11)
                    .fillColor('#374151')
                    .text(label, 325, totalY, {
                        width: 90,
                        align: 'right'
                    })
                    .fillColor('#111827')
                    .text(
                        `INR ${formatAmount(amount)}`,
                        420,
                        totalY,
                        {
                            width: 110,
                            align: 'right'
                        }
                    );

                totalY += 22;
            };

            addTotalRow(
                'Subtotal',
                booking.originalAmount ?? booking.amount
            );

            addTotalRow(
                'Discount',
                -(Number(booking.discountAmount) || 0)
            );

            addTotalRow(
                'Total paid',
                booking.amount,
                true
            );

            doc.moveTo(325, totalY + 2)
                .lineTo(530, totalY + 2)
                .strokeColor('#d1d5db')
                .stroke();

            doc.font('Helvetica')
                .fontSize(9)
                .fillColor('#6b7280')
                .text(
                    'This invoice confirms payment received for the booking shown above. The event ticket is issued separately after booking approval.',
                    50,
                    700,
                    {
                        width: 495,
                        align: 'center'
                    }
                );

            doc.fontSize(10)
                .fillColor('#111827')
                .text(
                    'Thank you for booking with EventiQ.',
                    50,
                    735,
                    {
                        width: 495,
                        align: 'center'
                    }
                );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });

module.exports = {
    generateInvoicePDF,
    getInvoiceNumber
};