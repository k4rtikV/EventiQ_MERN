const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');

/**
 * GET /api/wishlist
 * Returns all wishlist events belonging to the logged-in user.
 */
exports.getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'wishlist',
            options: {
                sort: {
                    createdAt: -1
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Filtering removes null entries in case an admin deleted
        // an event that had previously been wishlisted.
        const wishlist = user.wishlist.filter(Boolean);

        return res.json(wishlist);
    } catch (error) {
        console.error('Get wishlist error:', error);

        return res.status(500).json({
            message: 'Error fetching wishlist',
            error: error.message
        });
    }
};

/**
 * POST /api/wishlist/:eventId
 * Adds an event to the logged-in user's wishlist.
 */
exports.addToWishlist = async (req, res) => {
    try {
        const { eventId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({
                message: 'Invalid event ID'
            });
        }

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                // $addToSet prevents duplicate event IDs.
                $addToSet: {
                    wishlist: eventId
                }
            },
            {
                new: true
            }
        ).populate('wishlist');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json({
            message: 'Event added to wishlist',
            wishlist: user.wishlist.filter(Boolean)
        });
    } catch (error) {
        console.error('Add to wishlist error:', error);

        return res.status(500).json({
            message: 'Error adding event to wishlist',
            error: error.message
        });
    }
};

/**
 * DELETE /api/wishlist/:eventId
 * Removes an event from the logged-in user's wishlist.
 */
exports.removeFromWishlist = async (req, res) => {
    try {
        const { eventId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({
                message: 'Invalid event ID'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                $pull: {
                    wishlist: eventId
                }
            },
            {
                new: true
            }
        ).populate('wishlist');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.json({
            message: 'Event removed from wishlist',
            wishlist: user.wishlist.filter(Boolean)
        });
    } catch (error) {
        console.error('Remove from wishlist error:', error);

        return res.status(500).json({
            message: 'Error removing event from wishlist',
            error: error.message
        });
    }
};