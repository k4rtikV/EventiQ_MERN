const express = require('express');

const router = express.Router();

const {
    supportRequest,
    ticketDelaySupportRequest,
    refundDelaySupportRequest
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

router.post(
    '/refund-delay/:bookingId',
    protect,
    refundDelaySupportRequest
);

module.exports = router;