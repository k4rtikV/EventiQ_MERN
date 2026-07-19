const express = require('express');

const router = express.Router();

const {
    supportRequest,
    ticketDelaySupportRequest
} = require('../controllers/supportController');

const {
    protect
} = require('../middleware/auth');

router.post(
    '/',
    supportRequest
);

router.post(
    '/ticket-delay/:bookingId',
    protect,
    ticketDelaySupportRequest
);

module.exports = router;