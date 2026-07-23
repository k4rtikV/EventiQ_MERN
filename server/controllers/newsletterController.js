const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const NewsletterCampaign = require('../models/NewsletterCampaign');

const {
    sendNewsletterPromoEmail,
    sendNewsletterCampaignEmail
} = require('../utils/email');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.subscribeToNewsletter = async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();

        if (!name) {
            return res.status(400).json({ message: 'Please enter your name.' });
        }

        if (name.length > 80) {
            return res.status(400).json({ message: 'Name cannot exceed 80 characters.' });
        }

        if (!emailPattern.test(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }

        let subscriber = await NewsletterSubscriber.findOne({ email });
        const isNewSubscriber = !subscriber;

        if (subscriber) {
            subscriber.name = name;
            subscriber.isSubscribed = true;
            subscriber.unsubscribedAt = null;
            await subscriber.save();
        } else {
            subscriber = await NewsletterSubscriber.create({
                name,
                email,
                isSubscribed: true
            });
        }

        await sendNewsletterPromoEmail(subscriber.email, subscriber.name);

        res.status(isNewSubscriber ? 201 : 200).json({
            message: 'Subscription successful. Your promo code has been sent to your email.'
        });
    } catch (error) {
        console.error('Newsletter subscription error:', error);

        if (error.code === 11000) {
            return res.status(409).json({ message: 'This email is already subscribed.' });
        }

        res.status(500).json({
            message: 'Unable to subscribe right now. Please try again later.'
        });
    }
};

exports.getNewsletterDashboard = async (req, res) => {
    try {
        const [subscribers, campaigns] = await Promise.all([
            NewsletterSubscriber.find()
                .sort({ createdAt: -1 })
                .select('name email isSubscribed promoUsed promoUsedAt createdAt updatedAt unsubscribedAt'),
            NewsletterCampaign.find()
                .sort({ sentAt: -1 })
                .limit(20)
                .populate('sentBy', 'name email')
        ]);

        const activeCount = subscribers.filter((subscriber) => subscriber.isSubscribed).length;

        res.json({
            subscribers,
            campaigns,
            stats: {
                total: subscribers.length,
                active: activeCount,
                inactive: subscribers.length - activeCount,
                promoUsed: subscribers.filter((subscriber) => subscriber.promoUsed).length,
                campaignsSent: campaigns.length
            }
        });
    } catch (error) {
        console.error('Newsletter dashboard error:', error);
        res.status(500).json({ message: 'Unable to load newsletter dashboard.' });
    }
};

exports.updateSubscriberStatus = async (req, res) => {
    try {
        const { isSubscribed } = req.body;

        if (typeof isSubscribed !== 'boolean') {
            return res.status(400).json({ message: 'A valid subscription status is required.' });
        }

        const subscriber = await NewsletterSubscriber.findById(req.params.id);

        if (!subscriber) {
            return res.status(404).json({ message: 'Newsletter subscriber not found.' });
        }

        subscriber.isSubscribed = isSubscribed;
        subscriber.unsubscribedAt = isSubscribed ? null : new Date();
        await subscriber.save();

        res.json({
            message: isSubscribed ? 'Subscriber reactivated.' : 'Subscriber deactivated.',
            subscriber
        });
    } catch (error) {
        console.error('Newsletter subscriber update error:', error);
        res.status(500).json({ message: 'Unable to update the subscriber.' });
    }
};

exports.deleteSubscriber = async (req, res) => {
    try {
        const subscriber = await NewsletterSubscriber.findById(req.params.id);

        if (!subscriber) {
            return res.status(404).json({ message: 'Newsletter subscriber not found.' });
        }

        await subscriber.deleteOne();
        res.json({ message: 'Subscriber permanently removed.' });
    } catch (error) {
        console.error('Newsletter subscriber deletion error:', error);
        res.status(500).json({ message: 'Unable to remove the subscriber.' });
    }
};

exports.sendNewsletterCampaign = async (req, res) => {
    try {
        const subject = String(req.body.subject || '').trim();
        const message = String(req.body.message || '').trim();

        if (subject.length < 3 || subject.length > 150) {
            return res.status(400).json({
                message: 'Newsletter subject must be between 3 and 150 characters.'
            });
        }

        if (message.length < 10 || message.length > 10000) {
            return res.status(400).json({
                message: 'Newsletter message must be between 10 and 10,000 characters.'
            });
        }

        const subscribers = await NewsletterSubscriber.find({ isSubscribed: true })
            .sort({ createdAt: 1 });

        if (subscribers.length === 0) {
            return res.status(400).json({ message: 'There are no active newsletter subscribers.' });
        }

        let deliveredCount = 0;
        let failedCount = 0;

        for (const subscriber of subscribers) {
            try {
                await sendNewsletterCampaignEmail(
                    subscriber.email,
                    subscriber.name,
                    subject,
                    message
                );
                deliveredCount += 1;
            } catch (emailError) {
                failedCount += 1;
                console.error(`Newsletter delivery failed for ${subscriber.email}:`, emailError.message);
            }
        }

        const campaign = await NewsletterCampaign.create({
            subject,
            message,
            recipientCount: subscribers.length,
            deliveredCount,
            failedCount,
            sentBy: req.user._id,
            sentAt: new Date()
        });

        res.status(201).json({
            message: `Newsletter processed for ${subscribers.length} subscriber${subscribers.length === 1 ? '' : 's'}.`,
            campaign
        });
    } catch (error) {
        console.error('Newsletter campaign error:', error);
        res.status(500).json({ message: 'Unable to send the newsletter.' });
    }
};
