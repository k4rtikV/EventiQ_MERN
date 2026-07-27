const axios = require('axios');

const BREVO_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email';

const normalizeAddress = (value) => {
    if (!value) return null;

    if (typeof value === 'string') {
        const email = value.trim();
        return email ? { email } : null;
    }

    if (typeof value === 'object' && value.email) {
        return {
            email: String(value.email).trim(),
            ...(value.name ? { name: String(value.name).trim() } : {})
        };
    }

    return null;
};

const normalizeRecipients = (value) => {
    if (!value) return [];

    const entries = Array.isArray(value)
        ? value
        : String(value).split(',');

    return entries
        .map(normalizeAddress)
        .filter((recipient) => recipient?.email);
};

const normalizeAttachments = (attachments = []) =>
    attachments.map((attachment) => {
        const name = attachment.name || attachment.filename;

        if (!name) {
            throw new Error('Every email attachment requires a filename.');
        }

        if (attachment.url) {
            return {
                name,
                url: attachment.url
            };
        }

        let content = attachment.content;

        if (Buffer.isBuffer(content)) {
            content = content.toString('base64');
        }

        if (typeof content !== 'string' || !content) {
            throw new Error(
                `Attachment "${name}" must contain a Buffer or Base64 string.`
            );
        }

        return {
            name,
            content
        };
    });

const sendBrevoEmail = async (mailOptions = {}) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.EMAIL_FROM_ADDRESS;
    const senderName =
        process.env.EMAIL_FROM_NAME ||
        'EventiQ';

    if (!apiKey) {
        throw new Error('BREVO_API_KEY is not configured.');
    }

    if (!senderEmail) {
        throw new Error(
            'EMAIL_FROM_ADDRESS is not configured.'
        );
    }

    const recipients = normalizeRecipients(mailOptions.to);

    if (recipients.length === 0) {
        throw new Error('At least one email recipient is required.');
    }

    if (!mailOptions.subject) {
        throw new Error('Email subject is required.');
    }

    if (!mailOptions.html && !mailOptions.text) {
        throw new Error('Email HTML or text content is required.');
    }

    const payload = {
        sender: {
            name: senderName,
            email: senderEmail
        },
        to: recipients,
        subject: mailOptions.subject
    };

    if (mailOptions.html) {
        payload.htmlContent = mailOptions.html;
    }

    if (mailOptions.text) {
        payload.textContent = mailOptions.text;
    }

    const replyTo = normalizeAddress(mailOptions.replyTo);
    if (replyTo) {
        payload.replyTo = replyTo;
    }

    const cc = normalizeRecipients(mailOptions.cc);
    if (cc.length > 0) {
        payload.cc = cc;
    }

    const bcc = normalizeRecipients(mailOptions.bcc);
    if (bcc.length > 0) {
        payload.bcc = bcc;
    }

    if (Array.isArray(mailOptions.attachments) && mailOptions.attachments.length > 0) {
        payload.attachment = normalizeAttachments(mailOptions.attachments);
    }

    try {
        const { data } = await axios.post(
            BREVO_EMAIL_URL,
            payload,
            {
                headers: {
                    accept: 'application/json',
                    'api-key': apiKey,
                    'content-type': 'application/json'
                },
                timeout: 30000
            }
        );

        return data;
    } catch (error) {
        const status = error.response?.status;
        const responseData = error.response?.data;

        console.error('Brevo API email error:', {
            status,
            message:
                responseData?.message ||
                error.message,
            code: responseData?.code,
            subject: mailOptions.subject,
            recipients: recipients.map(
                (recipient) => recipient.email
            )
        });

        const brevoError = new Error(
            responseData?.message ||
            'Unable to send email through Brevo.'
        );

        brevoError.status = status;
        brevoError.code = responseData?.code;
        brevoError.responseData = responseData;

        throw brevoError;
    }
};

module.exports = sendBrevoEmail;