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

        cancellationDetails: {
            cancelledBy: {
                type: String,
                enum: ['user', 'admin'],
                default: null
            },

            cancelledAt: {
                type: Date,
                default: null
            }
        },

        refund: {
            status: {
                type: String,
                enum: ['not_started', 'initiated', 'processing', 'sent_to_bank', 'completed', 'on_hold', 'failed'],
                default: 'not_started'
            },
            amount: { type: Number, default: null, min: 0 },
            reason: { type: String, default: null, trim: true },
            note: { type: String, default: null, trim: true },
            referenceId: { type: String, default: null, trim: true },
            initiatedAt: { type: Date, default: null },
            initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
            completedAt: { type: Date, default: null },
            lastUpdatedAt: { type: Date, default: null },
            history: [
                {
                    status: {
                        type: String,
                        enum: ['initiated', 'processing', 'sent_to_bank', 'completed', 'on_hold', 'failed'],
                        required: true
                    },
                    note: { type: String, default: null, trim: true },
                    updatedAt: { type: Date, default: Date.now },
                    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
                }
            ]
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