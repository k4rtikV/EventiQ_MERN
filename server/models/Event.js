const mongoose = require('mongoose');

const EVENT_CATEGORIES = [
    'Art', 'Business', 'Comedy', 'Education', 'Entertainment',
    'Food', 'Gaming', 'Music', 'Sports', 'Technology', 'Other'
];

const hasMeaningfulText = (value, {
    minimumLetters = 3,
    minimumConsecutiveLetters = 3,
    maximumDigitRatio = 0.5
} = {}) => {
    const trimmedValue = String(value || '').trim();
    const letters = trimmedValue.match(/\p{L}/gu) || [];
    const digits = trimmedValue.match(/\d/g) || [];
    const alphanumericCount = letters.length + digits.length;
    const containsWordLikeText = new RegExp(
        `\\p{L}{${minimumConsecutiveLetters},}`,
        'u'
    ).test(trimmedValue);
    const digitRatio = alphanumericCount === 0 ? 0 : digits.length / alphanumericCount;
    const hasRepeatedGarbage = /(.)\1{4,}/u.test(trimmedValue);

    return letters.length >= minimumLetters &&
        containsWordLikeText &&
        digitRatio <= maximumDigitRatio &&
        !hasRepeatedGarbage;
};

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Event title is required.'],
        trim: true,
        minlength: [3, 'Event title must be at least 3 characters.'],
        maxlength: [100, 'Event title must not exceed 100 characters.'],
        validate: {
            validator: (value) => hasMeaningfulText(value, {
                minimumLetters: 3,
                minimumConsecutiveLetters: 2,
                maximumDigitRatio: 0.5
            }),
            message: 'Event title must contain a meaningful event name, not mostly numbers or random characters.'
        }
    },
    description: {
        type: String,
        required: [true, 'Event description is required.'],
        trim: true,
        minlength: [20, 'Event description must be at least 20 characters.'],
        maxlength: [2000, 'Event description must not exceed 2,000 characters.'],
        validate: {
            validator: (value) => hasMeaningfulText(value, {
                minimumLetters: 10,
                minimumConsecutiveLetters: 3,
                maximumDigitRatio: 0.5
            }),
            message: 'Event description must contain meaningful text, not mostly numbers or random characters.'
        }
    },
    date: { type: Date, required: [true, 'Event date and time are required.'] },
    location: {
        type: String,
        required: [true, 'Event location is required.'],
        trim: true,
        minlength: [2, 'Location must be at least 2 characters.'],
        maxlength: [150, 'Location must not exceed 150 characters.'],
        validate: {
            validator: (value) => String(value).trim().toLowerCase() === 'online' || hasMeaningfulText(value, {
                minimumLetters: 3,
                minimumConsecutiveLetters: 3,
                maximumDigitRatio: 0.5
            }),
            message: 'Please enter a meaningful venue, city, address, or Online.'
        }
    },
    category: {
        type: String,
        required: [true, 'Event category is required.'],
        trim: true,
        enum: { values: EVENT_CATEGORIES, message: 'Please select a valid event category.' }
    },
    totalSeats: {
        type: Number,
        required: [true, 'Total seats are required.'],
        min: [1, 'Total seats must be at least 1.'],
        max: [100000, 'Total seats must not exceed 100,000.'],
        validate: { validator: Number.isInteger, message: 'Total seats must be a whole number.' }
    },
    availableSeats: {
        type: Number,
        required: [true, 'Available seats are required.'],
        min: [0, 'Available seats cannot be negative.'],
        max: [100000, 'Available seats must not exceed 100,000.'],
        validate: { validator: Number.isInteger, message: 'Available seats must be a whole number.' }
    },
    image: { type: String, trim: true, maxlength: [2048, 'Image URL must not exceed 2,048 characters.'], default: '' },
    ticketPrice: {
        type: Number,
        required: [true, 'Ticket price is required.'],
        default: 0,
        min: [0, 'Ticket price cannot be negative.'],
        max: [1000000, 'Ticket price must not exceed ₹10,00,000.']
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);