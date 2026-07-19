const NewsletterSubscriber = require(
    '../models/NewsletterSubscriber'
);

const {
    sendNewsletterPromoEmail
} = require('../utils/email');

const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.subscribeToNewsletter = async (
    req,
    res
) => {
    try {
        const name = String(
            req.body.name || ''
        ).trim();

        const email = String(
            req.body.email || ''
        )
            .trim()
            .toLowerCase();

        if (!name) {
            return res.status(400).json({
                message: 'Please enter your name.'
            });
        }

        if (name.length > 80) {
            return res.status(400).json({
                message:
                    'Name cannot exceed 80 characters.'
            });
        }

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                message:
                    'Please enter a valid email address.'
            });
        }

        let subscriber =
            await NewsletterSubscriber.findOne({
                email
            });

        if (subscriber) {
            subscriber.name = name;
            subscriber.isSubscribed = true;

            await subscriber.save();
        } else {
            subscriber =
                await NewsletterSubscriber.create({
                    name,
                    email,
                    isSubscribed: true
                });
        }

        await sendNewsletterPromoEmail(
            subscriber.email,
            subscriber.name
        );

        res.status(
            subscriber.createdAt.getTime() ===
                subscriber.updatedAt.getTime()
                ? 201
                : 200
        ).json({
            message:
                'Subscription successful. Your promo code has been sent to your email.'
        });
    } catch (error) {
        console.error(
            'Newsletter subscription error:',
            error
        );

        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    'This email is already subscribed.'
            });
        }

        res.status(500).json({
            message:
                'Unable to subscribe right now. Please try again later.'
        });
    }
};