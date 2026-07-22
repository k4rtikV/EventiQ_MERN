const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const OTP = require('../models/OTP');
const User = require('../models/User');
const NewsletterSubscriber = require(
    '../models/NewsletterSubscriber'
);

const {
    sendBookingEmail,
    sendOTPEmail,
    sendCancellationEmail,
    sendPaymentReceivedEmail
} = require('../utils/email');

const Razorpay = require('razorpay');
const crypto = require('crypto');
const axios = require('axios');

const fetchRazorpayPaymentMetadata = async (
    paymentId
) => {
    if (!paymentId) {
        return null;
    }

    const response = await axios.get(
        `https://api.razorpay.com/v1/payments/${paymentId}`,
        {
            auth: {
                username:
                    process.env.RAZORPAY_KEY_ID,
                password:
                    process.env.RAZORPAY_KEY_SECRET
            },
            params: {
                'expand[]': 'card'
            },
            timeout: 10000
        }
    );

    const payment = response.data || {};
    const card = payment.card || {};

    return {
        method: payment.method || null,

        paidAt: payment.created_at
            ? new Date(
                  payment.created_at * 1000
              )
            : new Date(),

        currency:
            payment.currency || 'INR',

        card:
            payment.method === 'card' ||
            payment.method === 'emi'
                ? {
                      last4:
                          card.last4 || null,

                      network:
                          card.network || null,

                      type:
                          card.type || null,

                      issuer:
                          card.issuer || null,

                      international:
                          Boolean(
                              card.international ??
                                  payment.international
                          ),

                      emi:
                          payment.method === 'emi'
                  }
                : undefined,

        upi:
            payment.method === 'upi'
                ? {
                      vpa:
                          payment.vpa || null
                  }
                : undefined,

        bank:
            payment.method ===
            'netbanking'
                ? payment.bank || null
                : null,

        wallet:
            payment.method === 'wallet'
                ? payment.wallet || null
                : null
    };
};

const generateOTP = () =>
    Math.floor(
        100000 + Math.random() * 900000
    ).toString();

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret:
        process.env.RAZORPAY_KEY_SECRET
});

const getPromoSettings = () => {
    const code = String(
        process.env.NEWSLETTER_PROMO_CODE ||
            'EVENTIQ10'
    )
        .trim()
        .toUpperCase();

    const active =
        String(
            process.env.NEWSLETTER_PROMO_ACTIVE ||
                'true'
        ).toLowerCase() === 'true';

    const discountPercent = Number(
        process.env
            .NEWSLETTER_DISCOUNT_PERCENT || 10
    );

    const minimumAmount = Number(
        process.env
            .NEWSLETTER_MINIMUM_AMOUNT || 500
    );

    const maximumDiscount = Number(
        process.env
            .NEWSLETTER_MAXIMUM_DISCOUNT || 300
    );

    return {
        code,

        active,

        discountPercent:
            Number.isFinite(discountPercent) &&
            discountPercent > 0
                ? discountPercent
                : 10,

        minimumAmount:
            Number.isFinite(minimumAmount) &&
            minimumAmount >= 0
                ? minimumAmount
                : 500,

        maximumDiscount:
            Number.isFinite(maximumDiscount) &&
            maximumDiscount >= 0
                ? maximumDiscount
                : 300
    };
};

const roundCurrency = (amount) =>
    Math.round(
        (Number(amount) + Number.EPSILON) *
            100
    ) / 100;

const removePurchasedEventFromWishlist =
    async (userId, eventId) => {
        if (!userId || !eventId) {
            return;
        }

        await User.findByIdAndUpdate(userId, {
            $pull: {
                wishlist: eventId
            }
        });
    };

const clearPromoFromBooking = (booking) => {
    booking.promoCode = null;
    booking.discountAmount = 0;

    booking.amount =
        booking.originalAmount ?? booking.amount;
};

const validateNewsletterPromo = async ({
    enteredCode,
    userEmail,
    originalAmount
}) => {
    const settings = getPromoSettings();

    const normalizedCode = String(
        enteredCode || ''
    )
        .trim()
        .toUpperCase();

    if (!normalizedCode) {
        return {
            valid: false,
            status: 400,
            message:
                'Please enter a promo code.'
        };
    }

    if (!settings.active) {
        return {
            valid: false,
            status: 400,
            message:
                'This promo offer is currently unavailable.'
        };
    }

    if (normalizedCode !== settings.code) {
        return {
            valid: false,
            status: 400,
            message:
                'Invalid promo code.'
        };
    }

    const normalizedEmail = String(
        userEmail || ''
    )
        .trim()
        .toLowerCase();

    const subscriber =
        await NewsletterSubscriber.findOne({
            email: normalizedEmail,
            isSubscribed: true
        });

    if (!subscriber) {
        return {
            valid: false,
            status: 403,
            message:
                'Subscribe to the EventiQ newsletter using your account email before using this promo code.'
        };
    }

    if (subscriber.promoUsed) {
        return {
            valid: false,
            status: 400,
            message:
                'You have already used your newsletter promo code.'
        };
    }

    const safeOriginalAmount = roundCurrency(
        originalAmount
    );

    if (safeOriginalAmount <= 0) {
        return {
            valid: false,
            status: 400,
            message:
                'Promo codes cannot be applied to free events.'
        };
    }

    if (
        safeOriginalAmount <
        settings.minimumAmount
    ) {
        return {
            valid: false,
            status: 400,
            message: `This promo requires a minimum booking amount of ₹${settings.minimumAmount}.`
        };
    }

    const percentageDiscount =
        safeOriginalAmount *
        (settings.discountPercent / 100);

    const discountAmount = roundCurrency(
        Math.min(
            percentageDiscount,
            settings.maximumDiscount
        )
    );

    const finalAmount = roundCurrency(
        Math.max(
            safeOriginalAmount -
                discountAmount,
            0
        )
    );

    return {
        valid: true,
        subscriber,
        code: settings.code,
        discountPercent:
            settings.discountPercent,
        discountAmount,
        originalAmount: safeOriginalAmount,
        finalAmount
    };
};

const markNewsletterPromoAsUsed =
    async ({ email, bookingId }) => {
        const normalizedEmail = String(
            email || ''
        )
            .trim()
            .toLowerCase();

        return NewsletterSubscriber.findOneAndUpdate(
            {
                email: normalizedEmail,
                isSubscribed: true,
                promoUsed: false
            },
            {
                $set: {
                    promoUsed: true,
                    promoUsedAt: new Date(),
                    promoUsedBookingId:
                        bookingId
                }
            },
            {
                new: true
            }
        );
    };

exports.sendBookingOTP = async (req, res) => {
    try {
        const { eventId } = req.body;

        /*
         * Only an active unpaid booking should prevent another booking.
         *
         * Paid bookings should never block the user from purchasing
         * another ticket for the same event, regardless of whether
         * the ticket has already been allotted.
         */
        if (eventId) {
            const existingUnpaidBooking =
                await Booking.findOne({
                    userId: req.user.id,
                    eventId,
                    paymentStatus: 'not_paid',
                    status: {
                        $ne: 'cancelled'
                    }
                });

            if (existingUnpaidBooking) {
                return res.status(400).json({
                    message:
                        'You already have an unpaid booking for this event. Please complete or cancel it from your profile before booking again.',
                    bookingId:
                        existingUnpaidBooking._id
                });
            }
        }

        const otp = generateOTP();

        await OTP.findOneAndDelete({
            email: req.user.email,
            action: 'event_booking'
        });

        await OTP.create({
            email: req.user.email,
            otp,
            action: 'event_booking'
        });

        await sendOTPEmail(
            req.user.email,
            otp,
            'event_booking'
        );

        return res.status(200).json({
            message: 'OTP sent successfully'
        });
    } catch (error) {
        console.error(
            'Send booking OTP error:',
            error
        );

        return res.status(500).json({
            message: 'Error sending OTP',
            error: error.message
        });
    }
};

exports.bookEvent = async (req, res) => {
    try {
        const { eventId, otp } = req.body;

        const validOTP = await OTP.findOne({
            email: req.user.email,
            otp,
            action: 'event_booking'
        });

        if (!validOTP) {
            return res.status(400).json({
                message:
                    'Invalid or expired OTP for booking'
            });
        }

        const event =
            await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        if (event.availableSeats <= 0) {
            return res.status(400).json({
                message:
                    'No seats available'
            });
        }

        /*
         * A previously paid booking is a completed purchase and must
         * not be considered a duplicate.
         *
         * Block the new booking only when the user has another active
         * booking for this event whose payment has not been completed.
         */
        const existingUnpaidBooking =
            await Booking.findOne({
                userId: req.user.id,
                eventId,
                paymentStatus: 'not_paid',
                status: {
                    $ne: 'cancelled'
                }
            });

        if (existingUnpaidBooking) {
            return res.status(400).json({
                message:
                    'You already have an unpaid booking for this event. Please complete or cancel it from your profile before booking again.',
                bookingId:
                    existingUnpaidBooking._id
            });
        }

        const ticketPrice = roundCurrency(
            event.ticketPrice || 0
        );

        const booking =
            await Booking.create({
                userId: req.user.id,
                eventId,
                status: 'pending',
                paymentStatus: 'not_paid',
                originalAmount: ticketPrice,
                discountAmount: 0,
                promoCode: null,
                amount: ticketPrice
            });

        /*
         * Delete the OTP only after the booking has been
         * successfully created.
         */
        await OTP.deleteOne({
            _id: validOTP._id
        });

        return res.status(201).json({
            message:
                'Booking request submitted',
            booking
        });
    } catch (error) {
        console.error(
            'Book event error:',
            error
        );

        return res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
};

exports.getBookingById = async (
    req,
    res
) => {
    try {
        const booking =
            await Booking.findById(
                req.params.id
            )
                .populate('eventId')
                .populate(
                    'userId',
                    'name email'
                );

        if (!booking) {
            return res.status(404).json({
                message:
                    'Booking not found'
            });
        }

        if (
            booking.userId._id.toString() !==
                req.user.id &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                message:
                    'Not authorized to view this booking'
            });
        }

        res.json(booking);
    } catch (error) {
        console.error(
            'Get booking error:',
            error
        );

        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
};
exports.updateBookingAddress = async (
    req,
    res
) => {
    try {
        const {
            street,
            city,
            state,
            zip,
            country,
            phone
        } = req.body;

        const booking =
            await Booking.findOne({
                _id: req.params.id,
                userId: req.user.id
            });

        if (!booking) {
            return res.status(404).json({
                message:
                    'Booking not found'
            });
        }

        if (
            booking.paymentStatus === 'paid'
        ) {
            return res.status(400).json({
                message:
                    'Address cannot be changed after payment.'
            });
        }

        booking.address = {
            street,
            city,
            state,
            zip,
            country,
            phone
        };

        await booking.save();

        res.json({
            message:
                'Address saved successfully',
            booking
        });
    } catch (error) {
        console.error(
            'Update address error:',
            error
        );

        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
};

exports.applyPromoCode = async (
    req,
    res
) => {
    try {
        const enteredCode =
            req.body.promoCode ||
            req.body.code;

        const booking =
            await Booking.findOne({
                _id: req.params.id,
                userId: req.user.id
            }).populate('eventId');

        if (!booking) {
            return res.status(404).json({
                message:
                    'Booking not found'
            });
        }

        if (
            booking.paymentStatus === 'paid'
        ) {
            return res.status(400).json({
                message:
                    'A promo code cannot be applied after payment.'
            });
        }

        if (!booking.eventId) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        const currentTicketPrice =
            roundCurrency(
                booking.eventId.ticketPrice ||
                    0
            );

        booking.originalAmount =
            currentTicketPrice;

        const result =
            await validateNewsletterPromo({
                enteredCode,
                userEmail:
                    req.user.email,
                originalAmount:
                    currentTicketPrice
            });

        if (!result.valid) {
            clearPromoFromBooking(booking);

            await booking.save();

            return res
                .status(result.status)
                .json({
                    message:
                        result.message
                });
        }

        booking.originalAmount =
            result.originalAmount;

        booking.discountAmount =
            result.discountAmount;

        booking.promoCode =
            result.code;

        booking.amount =
            result.finalAmount;

        booking.razorpayOrderId =
            undefined;

        await booking.save();

        res.json({
            message:
                'Promo code applied successfully.',
            booking,
            pricing: {
                originalAmount:
                    result.originalAmount,

                discountAmount:
                    result.discountAmount,

                finalAmount:
                    result.finalAmount,

                promoCode:
                    result.code,

                discountPercent:
                    result.discountPercent
            }
        });
    } catch (error) {
        console.error(
            'Apply promo error:',
            error
        );

        res.status(500).json({
            message:
                'Unable to apply the promo code right now.',
            error: error.message
        });
    }
};

exports.removePromoCode = async (
    req,
    res
) => {
    try {
        const booking =
            await Booking.findOne({
                _id: req.params.id,
                userId: req.user.id
            }).populate('eventId');

        if (!booking) {
            return res.status(404).json({
                message:
                    'Booking not found'
            });
        }

        if (
            booking.paymentStatus === 'paid'
        ) {
            return res.status(400).json({
                message:
                    'A promo code cannot be removed after payment.'
            });
        }

        const currentTicketPrice =
            roundCurrency(
                booking.eventId?.ticketPrice ??
                    booking.originalAmount ??
                    booking.amount
            );

        booking.originalAmount =
            currentTicketPrice;

        booking.discountAmount = 0;
        booking.promoCode = null;

        booking.amount =
            currentTicketPrice;

        booking.razorpayOrderId =
            undefined;

        await booking.save();

        res.json({
            message:
                'Promo code removed.',
            booking,
            pricing: {
                originalAmount:
                    currentTicketPrice,

                discountAmount: 0,

                finalAmount:
                    currentTicketPrice,

                promoCode: null
            }
        });
    } catch (error) {
        console.error(
            'Remove promo error:',
            error
        );

        res.status(500).json({
            message:
                'Unable to remove the promo code right now.',
            error: error.message
        });
    }
};

exports.createOrder = async (
    req,
    res
) => {
    try {
        const booking =
            await Booking.findOne({
                _id: req.params.id,
                userId: req.user.id
            }).populate('eventId');

        if (!booking) {
            return res.status(404).json({
                message:
                    'Booking not found'
            });
        }

        if (
            booking.paymentStatus === 'paid'
        ) {
            return res.status(400).json({
                message:
                    'Payment already completed for this booking'
            });
        }

        if (
            !booking.address ||
            !booking.address.street
        ) {
            if (
                !booking.allowNoAddress
            ) {
                return res.status(400).json({
                    message:
                        'Please save your address before proceeding to payment'
                });
            }
        }

        const event = booking.eventId;

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        if (event.availableSeats <= 0) {
            return res.status(400).json({
                message:
                    'This event is sold out.'
            });
        }

        const currentTicketPrice =
            roundCurrency(
                event.ticketPrice || 0
            );

        booking.originalAmount =
            currentTicketPrice;

        /*
         * Promo validation is repeated here.
         * This prevents someone from changing
         * the amount using browser developer tools.
         */
        if (booking.promoCode) {
            const promoResult =
                await validateNewsletterPromo({
                    enteredCode:
                        booking.promoCode,

                    userEmail:
                        req.user.email,

                    originalAmount:
                        currentTicketPrice
                });

            if (!promoResult.valid) {
                clearPromoFromBooking(
                    booking
                );

                await booking.save();

                return res
                    .status(
                        promoResult.status
                    )
                    .json({
                        message:
                            promoResult.message,

                        promoRemoved: true,

                        booking
                    });
            }

            booking.promoCode =
                promoResult.code;

            booking.discountAmount =
                promoResult.discountAmount;

            booking.amount =
                promoResult.finalAmount;
        } else {
            booking.discountAmount = 0;

            booking.amount =
                currentTicketPrice;
        }

        const finalAmount =
            roundCurrency(
                booking.amount
            );

        const amountInPaise = Math.round(
            finalAmount * 100
        );

        /*
         * Free events are completed without
         * opening the Razorpay checkout.
         */
        if (amountInPaise === 0) {
            booking.paymentStatus =
                'paid';

            booking.razorpayOrderId =
                undefined;

            booking.paymentDetails = {
                method: 'free',
                paidAt: new Date(),
                currency: 'INR'
            };

            await booking.save();

            await removePurchasedEventFromWishlist(
                req.user.id,
                event._id
            );

            try {
                await sendPaymentReceivedEmail(
                    req.user.email,
                    req.user.name,
                    event.title,
                    booking._id,
                    booking.amount
                );
            } catch (emailError) {
                console.error(
                    'Free booking payment email failed:',
                    emailError
                );
            }

            return res.json({
                free: true,
                booking
            });
        }

        const order =
            await razorpayInstance.orders.create({
                amount: amountInPaise,
                currency: 'INR',

                receipt:
                    `receipt_${booking._id}`,

                payment_capture: 1,

                notes: {
                    bookingId:
                        booking._id.toString(),

                    userId:
                        req.user.id.toString(),

                    promoCode:
                        booking.promoCode ||
                        ''
                }
            });

        booking.razorpayOrderId =
            order.id;

        await booking.save();

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,

            key:
                process.env
                    .RAZORPAY_KEY_ID,

            bookingId: booking._id,
            eventTitle: event.title,

            originalAmount:
                booking.originalAmount,

            discountAmount:
                booking.discountAmount,

            finalAmount:
                booking.amount,

            promoCode:
                booking.promoCode
        });
    } catch (error) {
        console.error(
            'Create Razorpay order error:',
            error
        );

        res.status(500).json({
            message:
                'Unable to create the payment order.',
            error: error.message
        });
    }
};
exports.verifyPayment = async (
    req,
    res
) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message:
                    'Missing payment verification details.'
            });
        }

        const booking =
            await Booking.findOne({
                _id: req.params.id,
                userId: req.user.id
            }).populate('eventId');

        if (!booking) {
            return res.status(404).json({
                message:
                    'Booking not found'
            });
        }

        if (
            booking.paymentStatus === 'paid'
        ) {
            return res.json({
                message:
                    'Payment has already been verified.',
                booking
            });
        }

        if (
            booking.razorpayOrderId !==
            razorpay_order_id
        ) {
            return res.status(400).json({
                message:
                    'Payment order does not match this booking.'
            });
        }

        const expectedSignature =
            crypto
                .createHmac(
                    'sha256',
                    process.env
                        .RAZORPAY_KEY_SECRET
                )
                .update(
                    `${razorpay_order_id}|${razorpay_payment_id}`
                )
                .digest('hex');

        const isSignatureValid =
            crypto.timingSafeEqual(
                Buffer.from(
                    expectedSignature
                ),
                Buffer.from(
                    razorpay_signature
                )
            );

        if (!isSignatureValid) {
            return res.status(400).json({
                message:
                    'Payment verification failed.'
            });
        }

        let razorpayPayment = null;

        try {
            razorpayPayment =
                await razorpayInstance.payments.fetch(
                    razorpay_payment_id
                );
        } catch (paymentFetchError) {
            console.error(
                'Unable to fetch Razorpay payment:',
                paymentFetchError
            );
        }

        if (razorpayPayment) {
            if (
                razorpayPayment.order_id !==
                razorpay_order_id
            ) {
                return res.status(400).json({
                    message:
                        'The Razorpay payment does not belong to this order.'
                });
            }

            if (
                razorpayPayment.status !==
                    'captured' &&
                razorpayPayment.captured !==
                    true
            ) {
                return res.status(400).json({
                    message:
                        'The payment has not been captured.'
                });
            }

            const expectedAmount =
                Math.round(
                    roundCurrency(
                        booking.amount
                    ) * 100
                );

            if (
                Number(
                    razorpayPayment.amount
                ) !== expectedAmount
            ) {
                return res.status(400).json({
                    message:
                        'The paid amount does not match the booking amount.'
                });
            }

            if (
                razorpayPayment.currency !==
                'INR'
            ) {
                return res.status(400).json({
                    message:
                        'Unexpected payment currency.'
                });
            }
        }

        /*
         * Revalidate the promo before finalising
         * the payment. This protects one-use promo
         * codes from being reused in another booking.
         */
        let promoSubscriber = null;

        if (booking.promoCode) {
            const promoResult =
                await validateNewsletterPromo({
                    enteredCode:
                        booking.promoCode,

                    userEmail:
                        req.user.email,

                    originalAmount:
                        booking.originalAmount
                });

            if (!promoResult.valid) {
                return res
                    .status(
                        promoResult.status
                    )
                    .json({
                        message:
                            promoResult.message
                    });
            }

            promoSubscriber =
                promoResult.subscriber;

            booking.originalAmount =
                promoResult.originalAmount;

            booking.discountAmount =
                promoResult.discountAmount;

            booking.amount =
                promoResult.finalAmount;

            booking.promoCode =
                promoResult.code;
        }

        booking.paymentStatus = 'paid';

        booking.razorpayOrderId =
            razorpay_order_id;

        booking.razorpayPaymentId =
            razorpay_payment_id;

        /*
         * Store only safe payment metadata.
         * Full card number, CVV, OTP and expiry
         * are never returned or stored.
         */
        try {
            const metadata =
                await fetchRazorpayPaymentMetadata(
                    razorpay_payment_id
                );

            if (metadata) {
                booking.paymentDetails =
                    metadata;
            } else {
                booking.paymentDetails = {
                    method:
                        razorpayPayment?.method ||
                        'online',

                    paidAt:
                        razorpayPayment?.created_at
                            ? new Date(
                                  razorpayPayment.created_at *
                                      1000
                              )
                            : new Date(),

                    currency:
                        razorpayPayment?.currency ||
                        'INR'
                };
            }
        } catch (metadataError) {
            console.error(
                'Payment metadata fetch failed:',
                metadataError
            );

            booking.paymentDetails = {
                method:
                    razorpayPayment?.method ||
                    'online',

                paidAt:
                    razorpayPayment?.created_at
                        ? new Date(
                              razorpayPayment.created_at *
                                  1000
                          )
                        : new Date(),

                currency:
                    razorpayPayment?.currency ||
                    'INR'
            };
        }

        await booking.save();

        if (promoSubscriber) {
            const promoMarked =
                await markNewsletterPromoAsUsed({
                    email: req.user.email,
                    bookingId:
                        booking._id
                });

            if (!promoMarked) {
                console.error(
                    'Newsletter promo was not marked as used after payment:',
                    booking._id
                );
            }
        }

        try {
            await removePurchasedEventFromWishlist(
                req.user.id,
                booking.eventId?._id ||
                    booking.eventId
            );
        } catch (wishlistError) {
            console.error(
                'Unable to remove purchased event from wishlist:',
                wishlistError
            );
        }

        try {
            await sendPaymentReceivedEmail(
                req.user.email,
                req.user.name,
                booking.eventId?.title ||
                    'your event',
                booking._id,
                booking.amount
            );
        } catch (emailError) {
            console.error(
                'Payment received email failed:',
                emailError
            );
        }

        res.json({
            message:
                'Payment verified successfully.',
            booking
        });
    } catch (error) {
        console.error(
            'Verify payment error:',
            error
        );

        res.status(500).json({
            message:
                'Unable to verify the payment.',
            error: error.message
        });
    }
};

exports.getMyPaymentHistory = async (
    req,
    res
) => {
    try {
        const bookings =
            await Booking.find({
                userId: req.user.id,
                paymentStatus: 'paid'
            })
                .populate('eventId')
                .sort({
                    'paymentDetails.paidAt':
                        -1,
                    updatedAt: -1,
                    createdAt: -1
                });

        /*
         * Backfill safe metadata for older paid
         * bookings that only have a payment ID.
         */
        await Promise.all(
            bookings.map(
                async (booking) => {
                    const alreadyHasDetails =
                        Boolean(
                            booking
                                .paymentDetails
                                ?.method
                        );

                    if (
                        alreadyHasDetails ||
                        !booking
                            .razorpayPaymentId
                    ) {
                        return;
                    }

                    try {
                        const metadata =
                            await fetchRazorpayPaymentMetadata(
                                booking.razorpayPaymentId
                            );

                        if (metadata) {
                            await Booking.updateOne(
                                { _id: booking._id },
                                {
                                    $set: {
                                        paymentDetails: metadata
                                        }
                                }
                            );
                        }
                    } catch (
                        metadataError
                    ) {
                        console.error(
                            `Unable to backfill payment details for booking ${booking._id}:`,
                            metadataError.message
                        );
                    }
                }
            )
        );

        res.json(bookings);
    } catch (error) {
        console.error(
            'Get payment history error:',
            error
        );

        res.status(500).json({
            message:
                'Unable to load payment history.',
            error: error.message
        });
    }
};
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('eventId')
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 });

        return res.status(200).json(bookings);
    } catch (error) {
        console.error(
            'Get all bookings error:',
            error
        );

        return res.status(500).json({
            message:
                'Unable to load admin bookings.',
            error: error.message
        });
    }
};
exports.confirmBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(
            req.params.id
        )
            .populate(
                'userId',
                'name email'
            )
            .populate('eventId');

        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found'
            });
        }

        if (!booking.eventId) {
            return res.status(404).json({
                message:
                    'The event linked to this booking no longer exists.'
            });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({
                message:
                    'A cancelled booking cannot be confirmed.'
            });
        }

        if (booking.status === 'confirmed') {
            return res.status(400).json({
                message:
                    'Booking is already confirmed.'
            });
        }

        if (
            booking.paymentStatus !== 'paid'
        ) {
            return res.status(400).json({
                message:
                    'Only bookings with completed payment can be confirmed.'
            });
        }

        const event = await Event.findById(
            booking.eventId._id
        );

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        if (event.availableSeats <= 0) {
            return res.status(400).json({
                message:
                    'No seats are available for this event.'
            });
        }

        /*
         * updateOne prevents old bookings from being
         * fully validated against newer required fields
         * such as originalAmount.
         */
        const bookingUpdate =
            await Booking.updateOne(
                {
                    _id: booking._id,
                    status: {
                        $ne: 'confirmed'
                    }
                },
                {
                    $set: {
                        status: 'confirmed'
                    }
                }
            );

        if (
            bookingUpdate.modifiedCount === 0
        ) {
            return res.status(409).json({
                message:
                    'The booking was already processed.'
            });
        }

        const eventUpdate =
            await Event.updateOne(
                {
                    _id: event._id,
                    availableSeats: {
                        $gt: 0
                    }
                },
                {
                    $inc: {
                        availableSeats: -1
                    }
                }
            );

        if (
            eventUpdate.modifiedCount === 0
        ) {
            /*
             * Restore the booking if the seat update
             * failed because no seats remained.
             */
            await Booking.updateOne(
                {
                    _id: booking._id
                },
                {
                    $set: {
                        status: 'pending'
                    }
                }
            );

            return res.status(400).json({
                message:
                    'No seats are available for this event.'
            });
        }

        booking.status = 'confirmed';

        try {
            await sendBookingEmail(
                booking.userId.email,
                booking.userId.name,
                booking.eventId.title,
                booking
            );
        } catch (emailError) {
            console.error(
                'Booking confirmation email failed:',
                emailError
            );
        }

        return res.status(200).json({
            message:
                'Booking confirmed successfully.',
            booking
        });
    } catch (error) {
        console.error(
            'Confirm booking error:',
            error
        );

        return res.status(500).json({
            message:
                'Unable to confirm the booking.',
            error: error.message
        });
    }
};
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({
                message: 'User not authenticated'
            });
        }

        /*
         * Load bookings without populate first.
         * This prevents one invalid or deleted event reference
         * from crashing the complete dashboard request.
         */
        const bookings = await Booking.find({
            userId
        })
            .sort({ createdAt: -1 })
            .lean();

        /*
         * Keep only valid MongoDB ObjectIds before querying events.
         */
        const validEventIds = [
            ...new Set(
                bookings
                    .map((booking) => booking.eventId)
                    .filter(
                        (eventId) =>
                            eventId &&
                            mongoose.Types.ObjectId.isValid(eventId)
                    )
                    .map((eventId) => eventId.toString())
            )
        ];

        const events = validEventIds.length
            ? await Event.find({
                  _id: { $in: validEventIds }
              }).lean()
            : [];

        const eventMap = new Map(
            events.map((event) => [
                event._id.toString(),
                event
            ])
        );

        /*
         * Manually attach event information.
         *
         * When an event was deleted or the old reference is invalid,
         * eventId becomes null instead of returning HTTP 500.
         */
        const safeBookings = bookings.map((booking) => {
            const eventId = booking.eventId?.toString();

            return {
                ...booking,
                eventId:
                    eventId && eventMap.has(eventId)
                        ? eventMap.get(eventId)
                        : null
            };
        });

        return res.status(200).json(safeBookings);
    } catch (error) {
        console.error('Get bookings error:', error);

        return res.status(500).json({
            message: 'Server Error',
            error: error.message,
            name: error.name
        });
    }
};

exports.cancelBooking = async (
    req,
    res
) => {
    try {
        const booking =
            await Booking.findById(
                req.params.id
            );

        if (!booking) {
            return res.status(404).json({
                message:
                    'Booking not found'
            });
        }

        if (
            booking.userId.toString() !==
                req.user.id &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                message: 'Not authorized'
            });
        }

        if (
            booking.status ===
            'cancelled'
        ) {
            return res.status(400).json({
                message:
                    'Already cancelled'
            });
        }

        const wasConfirmed =
            booking.status ===
            'confirmed';

        const wasPaid =
        booking.paymentStatus ===
        'paid';    

        const cancelledByAdmin =
            req.user.role === 'admin' &&
            booking.userId.toString() !==
                req.user.id;

        booking.status = 'cancelled';

/*
 * updateOne avoids validation errors on legacy
 * bookings that do not contain newer required fields.
 */
        await Booking.updateOne(
            {
                _id: booking._id
            },
            {
                $set: {
                status: 'cancelled'
                }
            }
        );

        if (wasConfirmed) {
            const event =
                await Event.findById(
                    booking.eventId
                );

            if (event) {
                event.availableSeats += 1;
                await event.save();
            }
        }

        if (wasPaid) {
        try {
            const bookingUser =
                await Booking.findById(
                    booking._id
                )
                    .populate(
                        'userId',
                        'name email'
                    )
                    .populate(
                        'eventId',
                        'title'
                    );

            if (
                bookingUser &&
                bookingUser.userId &&
                bookingUser.eventId
            ) {
                await sendCancellationEmail(
                    bookingUser.userId
                        .email,
                    bookingUser.userId
                        .name,
                    bookingUser.eventId
                        .title,
                    bookingUser.amount,
                    cancelledByAdmin
                );
            }
        } catch (emailError) {
            console.error(
                'Cancellation notification failed:',
                emailError
            );
        }
    }

        res.json({
            message:
                'Booking cancelled successfully'
        });
    } catch (error) {
        console.error(
            'Cancel booking error:',
            error
        );

        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
};

exports.repurchaseBooking = async (
    req,
    res
) => {
    try {
        const original =
            await Booking.findById(
                req.params.id
            ).populate('eventId');

        if (!original) {
            return res.status(404).json({
                message:
                    'Original booking not found'
            });
        }

        if (
            original.userId.toString() !==
                req.user.id &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                message:
                    'Not authorized to repurchase'
            });
        }

        const event =
            original.eventId;

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        if (event.availableSeats <= 0) {
            return res.status(400).json({
                message:
                    'No seats available'
            });
        }

        const ticketPrice = roundCurrency(
            event.ticketPrice || 0
        );

        const booking =
            await Booking.create({
                userId: req.user.id,
                eventId: event._id,
                status: 'pending',
                paymentStatus: 'not_paid',
                originalAmount:
                    ticketPrice,
                discountAmount: 0,
                promoCode: null,
                amount: ticketPrice,
                allowNoAddress: true
            });

        res.status(201).json({
            message:
                'Repurchase booking created',
            booking
        });
    } catch (error) {
        console.error(
            'Repurchase booking error:',
            error
        );

        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
};
