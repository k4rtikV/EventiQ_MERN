const express = require('express');

const {
    getWishlist,
    addToWishlist,
    removeFromWishlist
} = require('../controllers/wishlistController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Every wishlist route requires a logged-in user.
router.get('/', protect, getWishlist);
router.post('/:eventId', protect, addToWishlist);
router.delete('/:eventId', protect, removeFromWishlist);

module.exports = router;