const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const axios = require('axios');

const sendBookingEmail = async (userEmail, userName, eventTitle, booking) => {
    try {
        // create a PDF ticket in memory
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        const pdfEnd = new Promise((resolve) => doc.on('end', resolve));

        const pageWidth = doc.page.width;
        const pageMargin = doc.page.margins.left; // left & right

        // Event image (header) if available
        let headerHeight = 0;
        try {
            const imageUrl = booking.eventId && booking.eventId.image ? booking.eventId.image : null;
            if (imageUrl) {
                const resp = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                const imgBuffer = Buffer.from(resp.data, 'binary');
                const imgW = pageWidth - pageMargin * 2;
                const imgH = 140;
                doc.image(imgBuffer, pageMargin, 40, { width: imgW, height: imgH, align: 'center', valign: 'center' });
                headerHeight = imgH + 20;
            }
        } catch (imgErr) {
            // ignore image fetch errors
            headerHeight = 0;
        }

        const contentTop = 40 + headerHeight + 10;

        // Draw title
        doc.fontSize(20).fillColor('#0f172a').text(eventTitle, pageMargin, contentTop);

        // two-column layout: left for details, right for QR
        const leftX = pageMargin;
        const leftW = (pageWidth - pageMargin * 2) * 0.58;
        const rightW = (pageWidth - pageMargin * 2) - leftW - 20;
        const rightX = pageMargin + leftW + 20;

        const detailsTop = contentTop + 30;
        doc.fontSize(11).fillColor('#0b1220');
        doc.text(`Name: ${userName}`, leftX, detailsTop);
        doc.text(`Booking ID: ${booking._id}`, leftX, detailsTop + 18);
        const eventDate = booking.eventId && booking.eventId.date ? new Date(booking.eventId.date).toLocaleString() : '';
        doc.text(`Date: ${eventDate}`, leftX, detailsTop + 36);
        const location = booking.eventId && booking.eventId.location ? booking.eventId.location : '';
        doc.text(`Venue: ${location}`, leftX, detailsTop + 54);
        doc.text(`Price: ₹${booking.amount}`, leftX, detailsTop + 72);

        // QR on right
        const qrValue = `${booking._id}-${booking.userId || ''}`;
        try {
            const qrDataUrl = await QRCode.toDataURL(qrValue, { margin: 1, width: 220 });
            const base64 = qrDataUrl.split(',')[1];
            const qrBuffer = Buffer.from(base64, 'base64');
            const qrSize = 160;
            doc.image(qrBuffer, rightX, detailsTop - 6, { width: qrSize, height: qrSize });
        } catch (qrErr) {
            console.warn('QR generation failed', qrErr);
        }

        // Footer note
        doc.fontSize(10).fillColor('#666').text('Please show this ticket at the entrance.', leftX, detailsTop + 100);

        doc.end();
        await pdfEnd;
        const pdfBuffer = Buffer.concat(buffers);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Booking Confirmed: ${eventTitle}`,
            html: `
        <h2>Hi ${userName}!</h2>
        <p>Your booking for the event <strong>${eventTitle}</strong> is successfully confirmed.</p>
        <p>Booking ID: <strong>${booking._id}</strong></p>
        <p>Please find your ticket attached as a PDF.</p>
        <p>Thank you for choosing EventiQ.</p>
      `,
            attachments: [
                {
                    filename: `${eventTitle.replace(/[^a-z0-9]/gi, '_').slice(0, 40)}-${booking._id}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log('Booking email with PDF sent successfully to', userEmail);
    } catch (error) {
        console.error('Error sending booking email:', error);
        throw error;
    }
};

const sendOTPEmail = async (userEmail, otp, type) => {
    try {
        const title = type === 'account_verification' ? 'Verify your EventiQ Account' : 'EventiQ Booking Verification';
        const msg = type === 'account_verification'
            ? 'Please use the following OTP to verify your new EventiQ account.'
            : 'Please use the following OTP to verify and confirm your event booking.';

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: title,
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                    <h2 style="color: #111;">${title}</h2>
                    <p style="color: #555; font-size: 16px;">${msg}</p>
                    <div style="margin: 20px auto; padding: 15px; font-size: 24px; font-weight: bold; background: #f4f4f4; width: max-content; letter-spacing: 5px;">
                        ${otp}
                    </div>
                    <p style="color: #999; font-size: 12px;">This code expires in 5 minutes. If you didn't request this, please ignore this email.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${userEmail} for ${type}`);
    } catch (error) {
        console.error('Error sending OTP email:', error);
    }
};

const sendSupportEmail = async (name, userEmail, message) => {
    try {
        const supportRecipient = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: supportRecipient,
            subject: `Support query from ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
                    <h2 style="color: #111;">New Support Request</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${userEmail}</p>
                    <p><strong>Message:</strong></p>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log('Support email sent successfully to', supportRecipient);
    } catch (error) {
        console.error('Error sending support email:', error);
        throw error;
    }
};

const sendCancellationEmail = async (userEmail, userName, eventTitle, amount, cancelledByAdmin) => {
    try {
        const reasonText = cancelledByAdmin
            ? 'Your booking has been cancelled due to an issue processing payment from your bank.'
            : 'Your booking has been cancelled. You will be refunded the amount minus processing fees.';

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Booking cancelled for ${eventTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
                    <h2 style="color: #111;">Booking Cancelled</h2>
                    <p>Hi ${userName},</p>
                    <p>We wanted to let you know that your booking for <strong>${eventTitle}</strong> has been cancelled.</p>
                    <p>${reasonText}</p>
                    <p>Booking amount: <strong>₹${amount?.toFixed ? amount.toFixed(2) : amount}</strong></p>
                    <p>If you have any questions, please contact our support team.</p>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">This is an automated message from EventiQ.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log('Cancellation email sent to', userEmail);
    } catch (error) {
        console.error('Error sending cancellation email:', error);
        throw error;
    }
};

module.exports = { sendBookingEmail, sendOTPEmail, sendSupportEmail, sendCancellationEmail };