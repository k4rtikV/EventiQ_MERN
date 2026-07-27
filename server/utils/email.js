const dotenv = require('dotenv');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const axios = require('axios');
const sendBrevoEmail = require('./sendBrevoEmail');
const {
    bookingConfirmedTemplate,
    otpTemplate,
    supportTemplate,
    cancellationTemplate,
    refundTemplate,
    paymentReceivedTemplate,
    newsletterPromoTemplate,
    newsletterCampaignTemplate
} = require('./emailTemplates');

dotenv.config();

const sendBookingEmail = async (
    userEmail,
    userName,
    eventTitle,
    booking
) => {
    try {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });

        const buffers = [];

        doc.on('data', (chunk) =>
            buffers.push(chunk)
        );

        const pdfEnd = new Promise(
            (resolve) =>
                doc.on('end', resolve)
        );

        const pageWidth = doc.page.width;
        const pageMargin =
            doc.page.margins.left;

        let headerHeight = 0;

        try {
            const imageUrl =
                booking.eventId &&
                booking.eventId.image
                    ? booking.eventId.image
                    : null;

            if (imageUrl) {
                const response =
                    await axios.get(
                        imageUrl,
                        {
                            responseType:
                                'arraybuffer'
                        }
                    );

                const imageBuffer =
                    Buffer.from(
                        response.data,
                        'binary'
                    );

                const imageWidth =
                    pageWidth -
                    pageMargin * 2;

                const imageHeight = 140;

                doc.image(
                    imageBuffer,
                    pageMargin,
                    40,
                    {
                        width: imageWidth,
                        height: imageHeight,
                        align: 'center',
                        valign: 'center'
                    }
                );

                headerHeight =
                    imageHeight + 20;
            }
        } catch (imageError) {
            console.warn(
                'Unable to add event image to ticket:',
                imageError.message
            );

            headerHeight = 0;
        }

        const contentTop =
            40 + headerHeight + 10;

        doc.fontSize(20)
            .fillColor('#0f172a')
            .text(
                eventTitle,
                pageMargin,
                contentTop
            );

        const leftX = pageMargin;

        const leftWidth =
            (pageWidth -
                pageMargin * 2) *
            0.58;

        const rightX =
            pageMargin +
            leftWidth +
            20;

        const detailsTop =
            contentTop + 30;

        doc.fontSize(11).fillColor(
            '#0b1220'
        );

        doc.text(
            `Name: ${userName}`,
            leftX,
            detailsTop
        );

        doc.text(
            `Booking ID: ${booking._id}`,
            leftX,
            detailsTop + 18
        );

        const eventDate =
            booking.eventId &&
            booking.eventId.date
                ? new Date(
                      booking.eventId.date
                  ).toLocaleString()
                : '';

        doc.text(
            `Date: ${eventDate}`,
            leftX,
            detailsTop + 36
        );

        const location =
            booking.eventId &&
            booking.eventId.location
                ? booking.eventId.location
                : '';

        doc.text(
            `Venue: ${location}`,
            leftX,
            detailsTop + 54
        );

        doc.text(
            `Admits: ${Number(booking.quantity || 1)}`,
            leftX,
            detailsTop + 72
        );

        doc.text(
            `Total paid: ₹${formatAmount(booking.amount)}`,
            leftX,
            detailsTop + 90
        );

        const qrValue = `${booking._id}-${
            booking.userId || ''
        }`;

        try {
            const qrDataUrl =
                await QRCode.toDataURL(
                    qrValue,
                    {
                        margin: 1,
                        width: 220
                    }
                );

            const base64 =
                qrDataUrl.split(',')[1];

            const qrBuffer =
                Buffer.from(
                    base64,
                    'base64'
                );

            const qrSize = 160;

            doc.image(
                qrBuffer,
                rightX,
                detailsTop - 6,
                {
                    width: qrSize,
                    height: qrSize
                }
            );
        } catch (qrError) {
            console.warn(
                'QR generation failed:',
                qrError.message
            );
        }

        doc.fontSize(10)
            .fillColor('#666')
            .text(
                'Please show this ticket at the entrance.',
                leftX,
                detailsTop + 118
            );

        doc.end();

        await pdfEnd;

        const pdfBuffer =
            Buffer.concat(buffers);


        const eventLocation = booking.eventId?.location || '';

        await sendBrevoEmail({
            to: userEmail,
            subject: `Booking Confirmed: ${eventTitle}`,
            html: bookingConfirmedTemplate({
                userName,
                eventTitle,
                bookingId: booking._id,
                quantity: booking.quantity,
                amount: booking.amount,
                eventDate,
                location: eventLocation
            }),
            text: [
                `Hi ${userName},`,
                '',
                `Your booking for ${eventTitle} is confirmed.`,
                `Booking ID: ${booking._id}`,
                `Tickets: ${Number(booking.quantity || 1)}`,
                `Amount paid: ₹${Number(booking.amount || 0).toFixed(2)}`,
                '',
                'Your PDF ticket and QR code are attached to this email.'
            ].join('\n'),
            attachments: [{
                filename: `${eventTitle.replace(/[^a-z0-9]/gi, '_').slice(0, 40)}-${booking._id}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
        });

        console.log('Booking email with PDF sent successfully to', userEmail);
    } catch (error) {
        console.error('Error sending booking email:', error);
        throw error;
    }
};

const sendOTPEmail = async (userEmail, otp, type) => {
    try {
        const title = type === 'account_verification'
            ? 'Verify your EventiQ Account'
            : 'EventiQ Booking Verification';

        await sendBrevoEmail({
            to: userEmail,
            subject: title,
            html: otpTemplate({ otp, type }),
            text: `Your EventiQ verification code is ${otp}. It expires in 5 minutes. Never share this code with anyone.`
        });
        console.log(`OTP sent to ${userEmail} for ${type}`);
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw error;
    }
};

const sendSupportEmail = async (name, userEmail, message) => {
    try {
        const supportRecipient = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM_ADDRESS;
        await sendBrevoEmail({
            to: supportRecipient,
            replyTo: userEmail,
            subject: `Support query from ${name}`,
            html: supportTemplate({ name, userEmail, message }),
            text: `New EventiQ support request\n\nName: ${name}\nEmail: ${userEmail}\n\nMessage:\n${message}`
        });
        console.log('Support email sent successfully to', supportRecipient);
    } catch (error) {
        console.error('Error sending support email:', error);
        throw error;
    }
};

const sendCancellationEmail = async (userEmail, userName, eventTitle, amount, cancelledByAdmin) => {
    try {
        await sendBrevoEmail({
            to: userEmail,
            subject: `Booking cancelled for ${eventTitle}`,
            html: cancellationTemplate({ userName, eventTitle, amount, cancelledByAdmin }),
            text: [
                `Hi ${userName},`, '',
                `Your booking for ${eventTitle} has been cancelled.`,
                `Booking amount: ₹${Number(amount || 0).toFixed(2)}`,
                cancelledByAdmin
                    ? 'The booking was cancelled because payment processing could not be completed with your bank.'
                    : 'Where applicable, the refundable amount will be processed after the required deductions.',
                '', 'Contact EventiQ support if you need assistance.'
            ].join('\n')
        });
        console.log('Cancellation email sent to', userEmail);
    } catch (error) {
        console.error('Error sending cancellation email:', error);
        throw error;
    }
};

const sendRefundInitiatedEmail = async (userEmail, userName, eventTitle, bookingId, refundAmount, reason) => {
    try {
        await sendBrevoEmail({
            to: userEmail,
            subject: `Refund initiated for ${eventTitle}`,
            html: refundTemplate({ userName, eventTitle, bookingId, refundAmount, reason }),
            text: [
                `Hi ${userName},`, '',
                `Your refund for ${eventTitle} has been initiated.`,
                `Booking ID: ${bookingId}`,
                `Refund amount: ₹${Number(refundAmount || 0).toFixed(2)}`,
                `Reason: ${reason}`, '',
                'The refund will be returned to the original payment method. Bank processing times may vary.'
            ].join('\n')
        });
        console.log('Refund initiation email sent to', userEmail);
    } catch (error) {
        console.error('Error sending refund initiation email:', error);
        throw error;
    }
};

const sendPaymentReceivedEmail = async (userEmail, userName, eventTitle, bookingId, amount) => {
    try {
        await sendBrevoEmail({
            to: userEmail,
            subject: 'Payment Received – Your Booking is Being Processed',
            html: paymentReceivedTemplate({ userName, eventTitle, bookingId, amount }),
            text: [
                `Hi ${userName},`, '',
                `We received your payment for ${eventTitle}.`,
                `Booking ID: ${bookingId}`,
                `Amount paid: ₹${Number(amount || 0).toFixed(2)}`, '',
                'Your booking is being reviewed. Once approved, you will receive a PDF ticket and QR code.'
            ].join('\n')
        });
        console.log('Payment received email sent to', userEmail);
    } catch (error) {
        console.error('Error sending payment received email:', error);
        throw error;
    }
};

const sendNewsletterPromoEmail = async (userEmail, userName) => {
    try {
        const promoCode = String(process.env.NEWSLETTER_PROMO_CODE || 'EVENTIQ10').trim().toUpperCase();
        const discountPercent = Number(process.env.NEWSLETTER_DISCOUNT_PERCENT || 10);
        const minimumAmount = Number(process.env.NEWSLETTER_MINIMUM_AMOUNT || 500);
        const maximumDiscount = Number(process.env.NEWSLETTER_MAXIMUM_DISCOUNT || 300);
        const promoActive = String(process.env.NEWSLETTER_PROMO_ACTIVE || 'true').toLowerCase() === 'true';
        if (!promoActive) throw new Error('Newsletter promo is currently disabled.');

        await sendBrevoEmail({
            to: userEmail,
            subject: 'Welcome to EventiQ – Your Discount Code',
            html: newsletterPromoTemplate({ userName, promoCode, discountPercent, minimumAmount, maximumDiscount }),
            text: [
                `Hi ${userName},`, '',
                `Welcome to the EventiQ newsletter. Your promo code is ${promoCode}.`,
                `Discount: ${discountPercent}%`,
                `Minimum booking amount: ₹${minimumAmount}`,
                `Maximum discount: ₹${maximumDiscount}`, '',
                'Use the code before continuing to Razorpay. One use per subscriber.'
            ].join('\n')
        });
        console.log('Newsletter promo email sent to', userEmail);
    } catch (error) {
        console.error('Error sending newsletter promo email:', error);
        throw error;
    }
};

const sendNewsletterCampaignEmail = async (userEmail, userName, subject, message) => {
    await sendBrevoEmail({
        to: userEmail,
        subject,
        html: newsletterCampaignTemplate({ userName, subject, message }),
        text: `Hello ${userName || 'Subscriber'},\n\n${message}\n\nBest regards,\nThe EventiQ Team`
    });
};

module.exports = {
    sendBookingEmail,
    sendOTPEmail,
    sendSupportEmail,
    sendCancellationEmail,
    sendRefundInitiatedEmail,
    sendPaymentReceivedEmail,
    sendNewsletterPromoEmail,
    sendNewsletterCampaignEmail
};