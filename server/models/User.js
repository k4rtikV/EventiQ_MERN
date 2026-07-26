const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        defaultAddress: {
            street: { type: String, trim: true, default: '' },
            city: { type: String, trim: true, default: '' },
            state: { type: String, trim: true, default: '' },
            zip: { type: String, trim: true, default: '' },
            country: { type: String, trim: true, default: 'India' },
            phone: { type: String, trim: true, default: '' }
        },

        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Event'
            }
        ]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);