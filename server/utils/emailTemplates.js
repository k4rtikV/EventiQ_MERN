const escapeHtml = (value = '') =>
    String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

const formatAmount = (amount) => {
    const numericAmount = Number(amount);
    return Number.isFinite(numericAmount)
        ? numericAmount.toFixed(2)
        : escapeHtml(amount);
};

const formatDate = (value) => {
    if (!value) return 'To be announced';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? escapeHtml(value)
        : date.toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short'
          });
};

const detailRows = (rows = []) => rows
    .filter((row) => row && row.value !== undefined && row.value !== null && row.value !== '')
    .map(({ label, value }) => `
        <tr>
            <td style="padding:10px 0;color:#64748b;font-size:13px;vertical-align:top;width:42%;">${escapeHtml(label)}</td>
            <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:700;text-align:right;vertical-align:top;word-break:break-word;">${escapeHtml(value)}</td>
        </tr>
    `).join('');

const emailLayout = ({
    previewText,
    eyebrow = 'EVENTIQ UPDATE',
    title,
    subtitle,
    content,
    accent = '#2563eb'
}) => {
    const logoUrl = String(process.env.EVENTIQ_LOGO_URL || '').trim();
    const appUrl = String(process.env.CLIENT_URL || process.env.FRONTEND_URL || '').trim();
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM_ADDRESS || '';

    const logo = logoUrl
        ? `<img src="${escapeHtml(logoUrl)}" alt="EventiQ" width="150" style="display:block;max-width:150px;height:auto;border:0;" />`
        : `<div style="font-size:30px;font-weight:900;letter-spacing:-1px;color:#ffffff;">Eventi<span style="color:#67e8f9;">Q</span></div>`;

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#eef2ff;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(previewText || title)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef2ff;">
        <tr>
            <td align="center" style="padding:28px 12px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 18px 48px rgba(30,41,59,.14);">
                    <tr>
                        <td style="padding:30px 34px;background:linear-gradient(135deg,#2563eb 0%,#7c3aed 52%,#06b6d4 100%);">
                            ${logo}
                            <div style="margin-top:24px;font-size:11px;font-weight:800;letter-spacing:2px;color:#bfdbfe;">${escapeHtml(eyebrow)}</div>
                            <h1 style="margin:8px 0 0;font-size:29px;line-height:1.2;color:#ffffff;">${escapeHtml(title)}</h1>
                            ${subtitle ? `<p style="margin:10px 0 0;color:#e0f2fe;font-size:15px;line-height:1.6;">${escapeHtml(subtitle)}</p>` : ''}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 34px;">${content}</td>
                    </tr>
                    <tr>
                        <td style="padding:22px 34px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;color:#64748b;font-size:12px;line-height:1.7;">
                            ${appUrl ? `<a href="${escapeHtml(appUrl)}" style="color:#4f46e5;text-decoration:none;font-weight:700;">Open EventiQ</a><span style="color:#cbd5e1;"> &nbsp;•&nbsp; </span>` : ''}
                            ${supportEmail ? `<a href="mailto:${escapeHtml(supportEmail)}" style="color:#4f46e5;text-decoration:none;font-weight:700;">Contact support</a>` : 'EventiQ Support'}
                            <br />Discover. Book. Experience.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

const paragraph = (text) => `<p style="margin:0 0 18px;color:#475569;font-size:15px;line-height:1.75;">${text}</p>`;
const detailsCard = (rows) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;"><tr><td style="padding:10px 20px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${detailRows(rows)}</table></td></tr></table>`;
const notice = (text, accent = '#2563eb') => `<div style="margin:22px 0;padding:15px 17px;border-left:4px solid ${accent};background:#f8fafc;border-radius:10px;color:#334155;font-size:14px;line-height:1.65;">${text}</div>`;

const bookingConfirmedTemplate = ({ userName, eventTitle, bookingId, quantity, amount, eventDate, location }) => emailLayout({
    previewText: `Your ticket for ${eventTitle} is ready.`,
    eyebrow: 'BOOKING APPROVED',
    title: 'Your booking is confirmed',
    subtitle: 'Your PDF ticket and QR code are attached to this email.',
    accent: '#06b6d4',
    content: `
        ${paragraph(`Hi <strong style="color:#0f172a;">${escapeHtml(userName)}</strong>, your booking for <strong style="color:#0f172a;">${escapeHtml(eventTitle)}</strong> has been approved.`)}
        ${detailsCard([
            { label: 'Booking ID', value: bookingId },
            { label: 'Tickets', value: Number(quantity || 1) },
            { label: 'Amount paid', value: `₹${formatAmount(amount)}` },
            { label: 'Date', value: formatDate(eventDate) },
            { label: 'Venue', value: location || 'To be announced' }
        ])}
        ${notice('Download the attached PDF and keep it available on your phone. The QR code in the ticket may be checked at the entrance.', '#06b6d4')}
        ${paragraph('Thank you for choosing EventiQ. We look forward to seeing you at the event!')}
    `
});

const otpTemplate = ({ otp, type }) => {
    const accountVerification = type === 'account_verification';
    return emailLayout({
        previewText: `Your EventiQ verification code is ${otp}.`,
        eyebrow: 'SECURE VERIFICATION',
        title: accountVerification ? 'Verify your EventiQ account' : 'Confirm your event booking',
        subtitle: 'Use the one-time code below to continue securely.',
        content: `
            ${paragraph(accountVerification
                ? 'Enter this code to finish creating your EventiQ account.'
                : 'Enter this code to verify and continue with your event booking.')}
            <div style="margin:25px auto;padding:20px;text-align:center;background:linear-gradient(135deg,#eff6ff,#f5f3ff,#ecfeff);border:1px solid #c4b5fd;border-radius:16px;">
                <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#6366f1;text-transform:uppercase;">Your verification code</div>
                <div style="margin-top:10px;font-size:36px;font-weight:900;letter-spacing:8px;color:#0f172a;">${escapeHtml(otp)}</div>
            </div>
            ${notice('This code expires in 5 minutes. Never share your OTP with anyone, including someone claiming to represent EventiQ.', '#7c3aed')}
            ${paragraph('You can safely ignore this email if you did not request the code.')}
        `
    });
};

const supportTemplate = ({ name, userEmail, message }) => emailLayout({
    previewText: `New support request from ${name}.`,
    eyebrow: 'SUPPORT INBOX',
    title: 'New support request',
    subtitle: 'A customer submitted a message through EventiQ.',
    content: `
        ${detailsCard([
            { label: 'Name', value: name },
            { label: 'Email', value: userEmail }
        ])}
        <div style="padding:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
            <div style="font-size:12px;font-weight:800;letter-spacing:1px;color:#7c3aed;text-transform:uppercase;">Customer message</div>
            <div style="margin-top:10px;color:#334155;font-size:15px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</div>
        </div>
    `
});

const cancellationTemplate = ({ userName, eventTitle, amount, cancelledByAdmin }) => emailLayout({
    previewText: `Your booking for ${eventTitle} has been cancelled.`,
    eyebrow: 'BOOKING UPDATE',
    title: 'Booking cancelled',
    subtitle: eventTitle,
    accent: '#ef4444',
    content: `
        ${paragraph(`Hi <strong style="color:#0f172a;">${escapeHtml(userName)}</strong>, your booking for <strong style="color:#0f172a;">${escapeHtml(eventTitle)}</strong> has been cancelled.`)}
        ${detailsCard([{ label: 'Booking amount', value: `₹${formatAmount(amount)}` }, { label: 'Status', value: 'Cancelled' }])}
        ${notice(cancelledByAdmin
            ? 'The booking was cancelled because EventiQ could not complete payment processing with your bank.'
            : 'Your cancellation was recorded. Where applicable, the refundable amount will be processed after the required deductions.', '#ef4444')}
        ${paragraph('Please contact EventiQ support if you need help regarding this cancellation.')}
    `
});

const refundTemplate = ({ userName, eventTitle, bookingId, refundAmount, reason }) => emailLayout({
    previewText: `Your refund of ₹${formatAmount(refundAmount)} has been initiated.`,
    eyebrow: 'REFUND UPDATE',
    title: 'Your refund has been initiated',
    subtitle: eventTitle,
    content: `
        ${paragraph(`Hi <strong style="color:#0f172a;">${escapeHtml(userName)}</strong>, EventiQ has initiated the refund for your cancelled booking.`)}
        ${detailsCard([
            { label: 'Booking ID', value: bookingId },
            { label: 'Refund amount', value: `₹${formatAmount(refundAmount)}` },
            { label: 'Reason', value: reason }
        ])}
        ${notice('The refund is being returned to the original payment method. The time it takes to appear in your account depends on your bank or payment provider.', '#7c3aed')}
    `
});

const paymentReceivedTemplate = ({ userName, eventTitle, bookingId, amount }) => emailLayout({
    previewText: `Payment received for ${eventTitle}.`,
    eyebrow: 'PAYMENT SUCCESSFUL',
    title: 'Payment received',
    subtitle: 'Your booking is now being processed.',
    content: `
        ${paragraph(`Hi <strong style="color:#0f172a;">${escapeHtml(userName)}</strong>, we successfully received your payment for <strong style="color:#0f172a;">${escapeHtml(eventTitle)}</strong>.`)}
        ${detailsCard([
            { label: 'Event', value: eventTitle },
            { label: 'Booking ID', value: bookingId },
            { label: 'Amount paid', value: `₹${formatAmount(amount)}` },
            { label: 'Payment status', value: 'Successful' }
        ])}
        ${notice('Our team will verify the booking. Once approved, you will receive another email containing your PDF ticket and QR code.', '#2563eb')}
        ${paragraph('Approval usually takes less than 10 minutes. Check your Spam or Junk folder if the ticket email does not arrive within 10–15 minutes.')}
    `
});

const newsletterPromoTemplate = ({ userName, promoCode, discountPercent, minimumAmount, maximumDiscount }) => emailLayout({
    previewText: `Welcome to EventiQ. Your promo code is ${promoCode}.`,
    eyebrow: 'EVENTIQ NEWSLETTER',
    title: 'Welcome to the EventiQ community',
    subtitle: 'Here is a discount for your next eligible event booking.',
    content: `
        ${paragraph(`Hi <strong style="color:#0f172a;">${escapeHtml(userName)}</strong>, thank you for joining the EventiQ newsletter.`)}
        <div style="margin:24px 0;padding:22px;text-align:center;background:linear-gradient(135deg,#eff6ff,#f5f3ff,#ecfeff);border:1px dashed #7c3aed;border-radius:16px;">
            <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#6366f1;text-transform:uppercase;">Your promo code</div>
            <div style="margin-top:10px;font-size:30px;font-weight:900;letter-spacing:4px;color:#0f172a;">${escapeHtml(promoCode)}</div>
        </div>
        ${detailsCard([
            { label: 'Discount', value: `${discountPercent}%` },
            { label: 'Minimum booking', value: `₹${formatAmount(minimumAmount)}` },
            { label: 'Maximum discount', value: `₹${formatAmount(maximumDiscount)}` },
            { label: 'Usage', value: 'One use per subscriber' }
        ])}
        ${notice('Use this code in the promo-code field before continuing to Razorpay. The newsletter email must match your EventiQ account email.', '#06b6d4')}
    `
});

const newsletterCampaignTemplate = ({ userName, subject, message }) => emailLayout({
    previewText: subject,
    eyebrow: 'EVENTIQ NEWSLETTER',
    title: subject,
    subtitle: 'News, recommendations and updates from EventiQ.',
    content: `
        ${paragraph(`Hello <strong style="color:#0f172a;">${escapeHtml(userName || 'Subscriber')}</strong>,`)}
        <div style="color:#334155;font-size:15px;line-height:1.8;">${escapeHtml(message).replaceAll('\n', '<br />')}</div>
        ${paragraph('<br />Best regards,<br /><strong style="color:#0f172a;">The EventiQ Team</strong>')}
    `
});

const delayedSupportTemplate = ({ isTicket, name, email, eventTitle, bookingId, paymentId, invoiceNumber, amount, message }) => emailLayout({
    previewText: `${isTicket ? 'Ticket assignment' : 'Refund initiation'} delay request for ${eventTitle}.`,
    eyebrow: 'PRIORITY SUPPORT',
    title: isTicket ? 'Ticket assignment delay request' : 'Refund initiation delay request',
    subtitle: 'The related invoice is attached for reference.',
    content: `
        ${detailsCard([
            { label: 'Customer', value: name },
            { label: 'Email', value: email },
            { label: 'Event', value: eventTitle },
            { label: 'Booking ID', value: bookingId },
            { label: 'Payment ID', value: paymentId || 'Not available' },
            { label: 'Invoice', value: invoiceNumber },
            { label: 'Amount paid', value: `₹${formatAmount(amount)}` },
            { label: 'Current status', value: isTicket ? 'Paid – Pending approval' : 'Cancelled – Awaiting refund initiation' }
        ])}
        <div style="padding:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;">
            <div style="font-size:12px;font-weight:800;letter-spacing:1px;color:#7c3aed;text-transform:uppercase;">Customer message</div>
            <div style="margin-top:10px;color:#334155;font-size:15px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</div>
        </div>
    `
});

module.exports = {
    escapeHtml,
    formatAmount,
    bookingConfirmedTemplate,
    otpTemplate,
    supportTemplate,
    cancellationTemplate,
    refundTemplate,
    paymentReceivedTemplate,
    newsletterPromoTemplate,
    newsletterCampaignTemplate,
    delayedSupportTemplate
};