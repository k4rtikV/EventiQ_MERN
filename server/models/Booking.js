const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: true
        },

        status: {
            type: String,
            enum: [
                'confirmed',
                'cancelled',
                'pending'
            ],
            default: 'pending'
        },

        paymentStatus: {
            type: String,
            enum: ['paid', 'not_paid'],
            default: 'not_paid'
        },

        originalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        discountAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        promoCode: {
            type: String,
            default: null,
            uppercase: true,
            trim: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        address: {
            street: {
                type: String
            },

            city: {
                type: String
            },

            state: {
                type: String
            },

            zip: {
                type: String
            },

            country: {
                type: String
            },

            phone: {
                type: String
            }
        },

        razorpayOrderId: {
            type: String
        },

        razorpayPaymentId: {
            type: String
        },

        paymentDetails: {
            method: {
                type: String,
                default: null
            },

            paidAt: {
                type: Date,
                default: null
            },

            currency: {
                type: String,
                default: 'INR'
            },

            card: {
                last4: {
                    type: String,
                    default: null
                },

                network: {
                    type: String,
                    default: null
                },

                type: {
                    type: String,
                    default: null
                },

                issuer: {
                    type: String,
                    default: null
                },

                international: {
                    type: Boolean,
                    default: false
                },

                emi: {
                    type: Boolean,
                    default: false
                }
            },

            upi: {
                vpa: {
                    type: String,
                    default: null
                }
            },

            bank: {
                type: String,
                default: null
            },

            wallet: {
                type: String,
                default: null
            }
        },

        allowNoAddress: {
            type: Boolean,
            default: false
        },

        bookedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    'Booking',
    bookingSchema
);