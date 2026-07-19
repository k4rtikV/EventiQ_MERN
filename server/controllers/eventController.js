const Event = require('../models/Event');
const axios = require('axios');

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
        const {
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            ticketPrice,
            image
        } = req.body;

        const event = await Event.create({
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            availableSeats: totalSeats,
            ticketPrice: ticketPrice || 0,
            image: image || '',
            createdBy: req.user.id
        });

        res.status(201).json(event);
    } catch (error) {
        console.error(
            'Create event error:',
            error
        );

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