const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const axios = require('axios');

dotenv.config();

const transporter =
    nodemailer.createTransport({
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

const formatAmount = (amount) => {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
        return amount;
    }

    return numericAmount.toFixed(2);
};

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
            `Price: ₹${formatAmount(
                booking.amount
            )}`,
            leftX,
            detailsTop + 72
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
                detailsTop + 100
            );

        doc.end();

        await pdfEnd;

        const pdfBuffer =
            Buffer.concat(buffers);

        const safeEventTitle =
            escapeHtml(eventTitle);

        const safeUserName =
            escapeHtml(userName);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Booking Confirmed: ${eventTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; color: #111827;">
                    <h2>Hi ${safeUserName}!</h2>

                    <p>
                        Your booking for
                        <strong>${safeEventTitle}</strong>
                        is successfully confirmed.
                    </p>

                    <p>
                        Booking ID:
                        <strong>${booking._id}</strong>
                    </p>

                    <p>
                        Amount paid:
                        <strong>₹${formatAmount(
                            booking.amount
                        )}</strong>
                    </p>

                    <p>
                        Please find your ticket attached as a PDF.
                    </p>

                    <p>
                        Thank you for choosing EventiQ.
                    </p>
                </div>
            `,
            attachments: [
                {
                    filename: `${eventTitle
                        .replace(
                            /[^a-z0-9]/gi,
                            '_'
                        )
                        .slice(
                            0,
                            40
                        )}-${booking._id}.pdf`,
                    content: pdfBuffer,
                    contentType:
                        'application/pdf'
                }
            ]
        };

        await transporter.sendMail(
            mailOptions
        );

        console.log(
            'Booking email with PDF sent successfully to',
            userEmail
        );
    } catch (error) {
        console.error(
            'Error sending booking email:',
            error
        );

        throw error;
    }
};

const sendOTPEmail = async (
    userEmail,
    otp,
    type
) => {
    try {
        const title =
            type ===
            'account_verification'
                ? 'Verify your EventiQ Account'
                : 'EventiQ Booking Verification';

        const message =
            type ===
            'account_verification'
                ? 'Please use the following OTP to verify your new EventiQ account.'
                : 'Please use the following OTP to verify and confirm your event booking.';

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: title,
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                    <h2 style="color: #111;">
                        ${title}
                    </h2>

                    <p style="color: #555; font-size: 16px;">
                        ${message}
                    </p>

                    <div style="margin: 20px auto; padding: 15px; font-size: 24px; font-weight: bold; background: #f4f4f4; width: max-content; letter-spacing: 5px;">
                        ${otp}
                    </div>

                    <p style="color: #999; font-size: 12px;">
                        This code expires in 5 minutes.
                        If you did not request this,
                        please ignore this email.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(
            mailOptions
        );

        console.log(
            `OTP sent to ${userEmail} for ${type}`
        );
    } catch (error) {
        console.error(
            'Error sending OTP email:',
            error
        );

        throw error;
    }
};

const sendSupportEmail = async (
    name,
    userEmail,
    message
) => {
    try {
        const supportRecipient =
            process.env.SUPPORT_EMAIL ||
            process.env.EMAIL_USER;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: supportRecipient,
            replyTo: userEmail,
            subject: `Support query from ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
                    <h2 style="color: #111;">
                        New Support Request
                    </h2>

                    <p>
                        <strong>Name:</strong>
                        ${escapeHtml(name)}
                    </p>

                    <p>
                        <strong>Email:</strong>
                        ${escapeHtml(userEmail)}
                    </p>

                    <p>
                        <strong>Message:</strong>
                    </p>

                    <p style="white-space: pre-wrap;">
                        ${escapeHtml(message)}
                    </p>
                </div>
            `
        };

        await transporter.sendMail(
            mailOptions
        );

        console.log(
            'Support email sent successfully to',
            supportRecipient
        );
    } catch (error) {
        console.error(
            'Error sending support email:',
            error
        );

        throw error;
    }
};

const sendCancellationEmail = async (
    userEmail,
    userName,
    eventTitle,
    amount,
    cancelledByAdmin
) => {
    try {
        const reasonText =
            cancelledByAdmin
                ? 'Your booking has been cancelled due to an issue processing payment from your bank.'
                : 'Your booking has been cancelled. You will be refunded the amount minus processing fees.';

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Booking cancelled for ${eventTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
                    <h2 style="color: #111;">
                        Booking Cancelled
                    </h2>

                    <p>
                        Hi ${escapeHtml(
                            userName
                        )},
                    </p>

                    <p>
                        We wanted to let you know that your booking for
                        <strong>${escapeHtml(
                            eventTitle
                        )}</strong>
                        has been cancelled.
                    </p>

                    <p>
                        ${reasonText}
                    </p>

                    <p>
                        Booking amount:
                        <strong>
                            ₹${formatAmount(
                                amount
                            )}
                        </strong>
                    </p>

                    <p>
                        If you have any questions,
                        please contact our support team.
                    </p>

                    <p style="color: #999; font-size: 12px; margin-top: 20px;">
                        This is an automated message from EventiQ.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(
            mailOptions
        );

        console.log(
            'Cancellation email sent to',
            userEmail
        );
    } catch (error) {
        console.error(
            'Error sending cancellation email:',
            error
        );

        throw error;
    }
};

const sendRefundInitiatedEmail = async (
    userEmail,
    userName,
    eventTitle,
    bookingId,
    refundAmount,
    reason
) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Refund initiated for ${eventTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; color: #111827;">
                    <div style="max-width: 620px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden;">
                        <div style="background: #111827; color: #ffffff; padding: 22px 26px;">
                            <h2 style="margin: 0; font-size: 22px;">Refund Initiated</h2>
                        </div>

                        <div style="padding: 26px;">
                            <p>Hi ${escapeHtml(userName)},</p>

                            <p>
                                We have initiated your refund for
                                <strong>${escapeHtml(eventTitle)}</strong>.
                            </p>

                            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 20px 0;">
                                <p style="margin: 0 0 8px;"><strong>Booking ID:</strong> ${escapeHtml(bookingId)}</p>
                                <p style="margin: 0 0 8px;"><strong>Refund amount:</strong> ₹${formatAmount(refundAmount)}</p>
                                <p style="margin: 0;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>
                            </div>

                            <p>
                                The amount will be returned to the original payment method. Bank processing times may vary.
                            </p>

                            <p>
                                Regards,<br />
                                <strong>The EventiQ Team</strong>
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Refund initiation email sent to', userEmail);
    } catch (error) {
        console.error('Error sending refund initiation email:', error);
        throw error;
    }
};

const sendPaymentReceivedEmail =
    async (
        userEmail,
        userName,
        eventTitle,
        bookingId,
        amount
    ) => {
        try {
            const mailOptions = {
                from: process.env
                    .EMAIL_USER,
                to: userEmail,
                subject:
                    'Payment Received – Your Booking is Being Processed',
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
                        <h2 style="color: #111;">
                            Payment Received – Your Booking is Being Processed
                        </h2>

                        <p>
                            Hi ${escapeHtml(
                                userName
                            )},
                        </p>

                        <p>
                            Thank you for your purchase!
                        </p>

                        <p>
                            We have successfully received your payment for
                            <strong>${escapeHtml(
                                eventTitle
                            )}</strong>.
                        </p>

                        <h3>
                            Payment Summary
                        </h3>

                        <ul>
                            <li>
                                <strong>Event:</strong>
                                ${escapeHtml(
                                    eventTitle
                                )}
                            </li>

                            <li>
                                <strong>Booking ID:</strong>
                                ${bookingId}
                            </li>

                            <li>
                                <strong>Amount Paid:</strong>
                                ₹${formatAmount(
                                    amount
                                )}
                            </li>

                            <li>
                                <strong>Payment Status:</strong>
                                Successful
                            </li>
                        </ul>

                        <p>
                            Your booking is now being processed by our team.
                        </p>

                        <h4>
                            What happens next?
                        </h4>

                        <ul>
                            <li>
                                Our team will verify your booking.
                            </li>

                            <li>
                                Once approved, you will receive another email containing your PDF ticket, QR code and event instructions.
                            </li>
                        </ul>

                        <p>
                            This process usually takes
                            <strong>less than 10 minutes</strong>.
                        </p>

                        <p>
                            If you do not receive another email within 10–15 minutes,
                            check your Spam or Junk folder.
                            If it is still missing,
                            contact our support team using your Booking ID.
                        </p>

                        <p>
                            We look forward to seeing you at the event!
                        </p>

                        <p>
                            Best regards,
                        </p>

                        <p>
                            <strong>
                                The EventiQ Team
                            </strong>
                        </p>

                        <p style="color: #999; font-size: 12px; margin-top: 20px;">
                            This is an automated message from EventiQ.
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(
                mailOptions
            );

            console.log(
                'Payment received email sent to',
                userEmail
            );
        } catch (error) {
            console.error(
                'Error sending payment received email:',
                error
            );

            throw error;
        }
    };

const sendNewsletterPromoEmail =
    async (userEmail, userName) => {
        try {
            const promoCode = String(
                process.env
                    .NEWSLETTER_PROMO_CODE ||
                    'EVENTIQ10'
            )
                .trim()
                .toUpperCase();

            const discountPercent =
                Number(
                    process.env
                        .NEWSLETTER_DISCOUNT_PERCENT ||
                        10
                );

            const minimumAmount =
                Number(
                    process.env
                        .NEWSLETTER_MINIMUM_AMOUNT ||
                        500
                );

            const maximumDiscount =
                Number(
                    process.env
                        .NEWSLETTER_MAXIMUM_DISCOUNT ||
                        300
                );

            const promoActive =
                String(
                    process.env
                        .NEWSLETTER_PROMO_ACTIVE ||
                        'true'
                ).toLowerCase() ===
                'true';

            if (!promoActive) {
                throw new Error(
                    'Newsletter promo is currently disabled.'
                );
            }

            const mailOptions = {
                from: process.env
                    .EMAIL_USER,
                to: userEmail,
                subject:
                    'Welcome to EventiQ – Your Discount Code',
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 24px; max-width: 620px; margin: auto; color: #111827;">
                        <h2 style="margin-bottom: 8px;">
                            Welcome to EventiQ
                        </h2>

                        <p>
                            Hi ${escapeHtml(
                                userName
                            )},
                        </p>

                        <p>
                            Thank you for joining the EventiQ newsletter.
                        </p>

                        <p>
                            Use the following code during checkout to receive
                            <strong>${discountPercent}% off</strong>
                            your next eligible event booking:
                        </p>

                        <div style="background: #f3f4f6; border: 1px dashed #6b7280; border-radius: 12px; padding: 18px; margin: 24px 0; text-align: center;">
                            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">
                                Your promo code
                            </div>

                            <div style="font-size: 28px; font-weight: 800; letter-spacing: 3px; margin-top: 6px;">
                                ${escapeHtml(
                                    promoCode
                                )}
                            </div>
                        </div>

                        <h3>
                            Offer details
                        </h3>

                        <ul>
                            <li>
                                ${discountPercent}% discount
                            </li>

                            <li>
                                Minimum booking amount:
                                ₹${minimumAmount}
                            </li>

                            <li>
                                Maximum discount:
                                ₹${maximumDiscount}
                            </li>

                            <li>
                                One use per newsletter subscriber
                            </li>

                            <li>
                                Only valid for paid events
                            </li>

                            <li>
                                The newsletter email must match your EventiQ account email
                            </li>
                        </ul>

                        <p>
                            Enter this code in the promo code field on the payment page before continuing to Razorpay.
                        </p>

                        <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
                            EventiQ may disable or modify this offer in the future.
                        </p>

                        <p>
                            Best regards,
                            <br />
                            <strong>The EventiQ Team</strong>
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(
                mailOptions
            );

            console.log(
                'Newsletter promo email sent to',
                userEmail
            );
        } catch (error) {
            console.error(
                'Error sending newsletter promo email:',
                error
            );

            throw error;
        }
    };

module.exports = {
    sendBookingEmail,
    sendOTPEmail,
    sendSupportEmail,
    sendCancellationEmail,
    sendRefundInitiatedEmail,
    sendPaymentReceivedEmail,
    sendNewsletterPromoEmail
};