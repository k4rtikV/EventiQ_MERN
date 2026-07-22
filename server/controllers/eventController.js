const Event = require('../models/Event');
const axios = require('axios');

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

const isValidHttpUrl = (value) => {
    try {
        const parsedUrl = new URL(value);
        return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
        return false;
    }
};

const validateEventInput = (body) => {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const location = typeof body.location === 'string' ? body.location.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : '';
    const image = typeof body.image === 'string' ? body.image.trim() : '';
    const totalSeats = Number(body.totalSeats);
    const ticketPrice = Number(body.ticketPrice);
    const date = new Date(body.date);

    if (title.length < 3 || title.length > 100) return { error: 'Event title must be between 3 and 100 characters.' };
    if (!hasMeaningfulText(title, { minimumLetters: 3, minimumConsecutiveLetters: 2, maximumDigitRatio: 0.5 })) return { error: 'Event title must contain a meaningful event name, not mostly numbers or random characters.' };
    if (description.length < 20 || description.length > 2000) return { error: 'Event description must be between 20 and 2,000 characters.' };
    if (!hasMeaningfulText(description, { minimumLetters: 10, minimumConsecutiveLetters: 3, maximumDigitRatio: 0.5 })) return { error: 'Event description must contain meaningful text, not mostly numbers or random characters.' };
    if (location.length < 2 || location.length > 150) return { error: 'Location must be between 2 and 150 characters.' };
    if (location.toLowerCase() !== 'online' && !hasMeaningfulText(location, { minimumLetters: 3, minimumConsecutiveLetters: 3, maximumDigitRatio: 0.5 })) return { error: 'Please enter a meaningful venue, city, address, or Online.' };
    if (!EVENT_CATEGORIES.includes(category)) return { error: 'Please select a valid event category.' };
    if (!body.date || Number.isNaN(date.getTime())) return { error: 'Please select a valid event date and time.' };
    if (date.getTime() <= Date.now() + 4 * 60 * 1000) return { error: 'Event date and time must be at least 5 minutes in the future.' };
    if (!Number.isInteger(totalSeats) || totalSeats < 1 || totalSeats > 100000) return { error: 'Total seats must be a whole number between 1 and 100,000.' };

    const rawTicketPrice = String(body.ticketPrice ?? '');
    if (rawTicketPrice.trim() === '' || !Number.isFinite(ticketPrice) || ticketPrice < 0 || ticketPrice > 1000000 || !/^\d+(\.\d{1,2})?$/.test(rawTicketPrice)) return { error: 'Ticket price must be between ₹0 and ₹10,00,000 with no more than two decimal places.' };
    if (image && (image.length > 2048 || !isValidHttpUrl(image))) return { error: 'Please enter a valid HTTP or HTTPS image URL.' };

    return { data: { title, description, date, location, category, totalSeats, ticketPrice, image } };
};

exports.getEvents = async (req, res) => {
    try {
        const filters = {};

        if (req.query.category) {
            filters.category = req.query.category;
        }

        if (req.query.search) {
            filters.title = {
                $regex: req.query.search,
                $options: 'i'
            };
        }

        const events = await Event.find(filters).populate(
            'createdBy',
            'name email'
        );

        res.json(events);
    } catch (error) {
        console.error('Get events error:', error);

        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(
            req.params.id
        ).populate('createdBy', 'name email');

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        res.json(event);
    } catch (error) {
        console.error('Get event error:', error);

        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
};

/*
 * Returns the external event image through the EventiQ backend.
 *
 * This prevents browser CORS/hotlink issues and allows html2canvas
 * to include the event image in the downloadable ticket PDF.
 */
exports.getEventImage = async (req, res) => {
    try {
        const event = await Event.findById(
            req.params.id
        ).select('image');

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        const imageUrl = String(
            event.image || ''
        ).trim();

        if (!imageUrl) {
            return res.status(404).json({
                message:
                    'This event does not have an image'
            });
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(imageUrl);
        } catch (error) {
            return res.status(400).json({
                message:
                    'The event image URL is invalid'
            });
        }

        if (
            !['http:', 'https:'].includes(
                parsedUrl.protocol
            )
        ) {
            return res.status(400).json({
                message:
                    'Unsupported event image URL'
            });
        }

        /*
         * Convert old HTTP image URLs to HTTPS.
         * This prevents mixed-content failures on deployed HTTPS sites.
         */
        if (parsedUrl.protocol === 'http:') {
            parsedUrl.protocol = 'https:';
        }

        const imageResponse = await axios.get(
            parsedUrl.toString(),
            {
                responseType: 'arraybuffer',
                timeout: 15000,
                maxContentLength:
                    10 * 1024 * 1024,
                maxBodyLength:
                    10 * 1024 * 1024,
                headers: {
                    Accept: 'image/*',
                    'User-Agent':
                        'Mozilla/5.0 EventiQ/1.0'
                },
                validateStatus(status) {
                    return (
                        status >= 200 &&
                        status < 300
                    );
                }
            }
        );

        const contentType = String(
            imageResponse.headers[
                'content-type'
            ] || ''
        ).toLowerCase();

        if (
            !contentType.startsWith('image/')
        ) {
            return res.status(415).json({
                message:
                    'The supplied URL did not return an image'
            });
        }

        res.setHeader(
            'Content-Type',
            contentType
        );

        res.setHeader(
            'Cache-Control',
            'public, max-age=3600'
        );

        res.setHeader(
            'Cross-Origin-Resource-Policy',
            'cross-origin'
        );

        res.send(
            Buffer.from(imageResponse.data)
        );
    } catch (error) {
        console.error(
            'Get event image error:',
            error.message
        );

        const status =
            error.response?.status === 404
                ? 404
                : 502;

        res.status(status).json({
            message:
                'Unable to load the event image'
        });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const validation = validateEventInput(req.body);

        if (validation.error) {
            return res.status(400).json({ message: validation.error });
        }

        const eventData = validation.data;
        const event = await Event.create({
            ...eventData,
            availableSeats: eventData.totalSeats,
            createdBy: req.user.id
        });

        res.status(201).json(event);
    } catch (error) {
        console.error('Create event error:', error);

        if (error.name === 'ValidationError') {
            const firstError = Object.values(error.errors)[0];
            return res.status(400).json({
                message: firstError?.message || 'Please review the event details.'
            });
        }

        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event =
            await Event.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        res.json(event);
    } catch (error) {
        console.error(
            'Update event error:',
            error
        );

        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event =
            await Event.findByIdAndDelete(
                req.params.id
            );

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        res.json({
            message:
                'Event deleted successfully'
        });
    } catch (error) {
        console.error(
            'Delete event error:',
            error
        );

        res.status(500).json({
            message: 'Server Error',
            error: error.message
        });
    }
};