const { sendSupportEmail } = require('../utils/email');

const supportRequest = async (req, res) => {
    const { name, email, message } = req.body;
    console.log('Support request received:', { name, email, message });

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    try {
        await sendSupportEmail(name, email, message);
        res.status(200).json({ message: 'Support query sent successfully.' });
    } catch (error) {
        console.error('Support email error:', error);
        res.status(500).json({ message: error.response?.data?.message || 'Failed to send support query. Please try again later.' });
    }
};

module.exports = { supportRequest };
