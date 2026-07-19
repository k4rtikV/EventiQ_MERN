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
    async ({
        email,
        bookingId
    }) => {
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

exports.sendBookingOTP = async (
    req,
    res
) => {
    try {
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

        res.json({
            message: 'OTP sent successfully'
        });
    } catch (error) {
        console.error(
            'Send booking OTP error:',
            error
        );

        res.status(500).json({
            message: 'Error sending OTP',
            error: error.message
        });
    }
};

exports.bookEvent = async (
    req,
    res
) => {
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

        const existingBooking =
            await Booking.findOne({
                userId: req.user.id,
                eventId
            });

        if (
            existingBooking &&
            existingBooking.status !==
                'cancelled'
        ) {
            return res.status(400).json({
                message:
                    'Already booked or pending, please go to your profile to manage your bookings'
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

        await OTP.deleteOne({
            _id: validOTP._id
        });

        res.status(201).json({
            message:
                'Booking request submitted',
            booking
        });
    } catch (error) {
        console.error(
            'Book event error:',
            error
        );

        res.status(500).json({
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
         * This prevents someone from changing the
         * amount in browser developer tools.
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
         * Free events are completed without opening Razorpay.
         * Newsletter promo codes are not allowed on free events.
         */
        if (amountInPaise === 0) {
            booking.paymentStatus =
                'paid';
            booking.razorpayOrderId =
                undefined;

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
                receipt: `receipt_${booking._id}`,
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
            key: process.env
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
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
        } = req.body;

        if (
            !razorpay_payment_id ||
            !razorpay_order_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message:
                    'Incomplete Razorpay payment details.'
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
            !booking.razorpayOrderId ||
            booking.razorpayOrderId !==
                razorpay_order_id
        ) {
            return res.status(400).json({
                message:
                    'Booking order mismatch'
            });
        }

        const generatedSignature =
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

        const receivedSignature =
            Buffer.from(
                razorpay_signature
            );

        const expectedSignature =
            Buffer.from(
                generatedSignature
            );

        if (
            receivedSignature.length !==
                expectedSignature.length ||
            !crypto.timingSafeEqual(
                receivedSignature,
                expectedSignature
            )
        ) {
            return res.status(400).json({
                message:
                    'Invalid payment signature'
            });
        }

        /*
         * If a newsletter promo was used,
         * claim the one-time subscriber usage
         * before completing the booking.
         */
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

            const claimedSubscriber =
                await markNewsletterPromoAsUsed(
                    {
                        email:
                            req.user.email,
                        bookingId:
                            booking._id
                    }
                );

            if (!claimedSubscriber) {
                return res.status(409).json({
                    message:
                        'This newsletter promo has already been used.'
                });
            }
        }

        booking.paymentStatus = 'paid';
        booking.razorpayPaymentId =
            razorpay_payment_id;

        await booking.save();

        await removePurchasedEventFromWishlist(
            req.user.id,
            booking.eventId._id
        );

        try {
            await sendPaymentReceivedEmail(
                req.user.email,
                req.user.name,
                booking.eventId.title,
                booking._id,
                booking.amount
            );
        } catch (emailError) {
            console.error(
                'Failed to send payment received email:',
                emailError
            );
        }

        res.json({
            message:
                'Payment verified successfully',
            booking
        });
    } catch (error) {
        console.error(
            'Verify payment error:',
            error
        );

        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
};

exports.confirmBooking = async (
    req,
    res
) => {
    try {
        const booking =
            await Booking.findById(
                req.params.id
            )
                .populate('userId')
                .populate('eventId');

        if (!booking) {
            return res.status(404).json({
                message:
                    'Booking not found'
            });
        }

        if (
            booking.status ===
            'confirmed'
        ) {
            return res.status(400).json({
                message:
                    'Booking is already confirmed'
            });
        }

        if (
            booking.paymentStatus !==
            'paid'
        ) {
            return res.status(400).json({
                message:
                    'Cannot verify booking without completed payment'
            });
        }

        const event =
            await Event.findById(
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
                    'No seats available to confirm this booking'
            });
        }

        booking.status = 'confirmed';

        await booking.save();

        event.availableSeats -= 1;

        await event.save();

        await sendBookingEmail(
            booking.userId.email,
            booking.userId.name,
            booking.eventId.title,
            booking
        );

        res.json({
            message:
                'Booking verified successfully',
            booking
        });
    } catch (error) {
        console.error(
            'Confirm booking error:',
            error
        );

        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
};

exports.getMyBookings = async (
    req,
    res
) => {
    try {
        const bookings =
            req.user.role === 'admin'
                ? await Booking.find()
                      .populate('eventId')
                      .populate(
                          'userId',
                          'name email'
                      )
                      .sort({
                          createdAt: -1
                      })
                : await Booking.find({
                      userId: req.user.id
                  })
                      .populate('eventId')
                      .sort({
                          createdAt: -1
                      });

        res.json(bookings);
    } catch (error) {
        console.error(
            'Get bookings error:',
            error
        );

        res.status(500).json({
            message: 'Server Error',
            error: error.message
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

        const cancelledByAdmin =
            req.user.role === 'admin' &&
            booking.userId.toString() !==
                req.user.id;

        booking.status = 'cancelled';

        await booking.save();

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