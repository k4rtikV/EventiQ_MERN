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

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Booking Confirmed: ${eventTitle}`,
            html: `
        <h2>Hi ${userName}!</h2>
        <p>Your booking for the event <strong>${eventTitle}</strong> is successfully confirmed.</p>
        <p>Thank you for choosing EventiQ.</p>
      `
        };
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to', userEmail);
    } catch (error) {
        console.error('Error sending email:', error);
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