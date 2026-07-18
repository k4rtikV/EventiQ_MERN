const express = require('express');

const router = express.Router();

const {
    bookEvent,
    confirmBooking,
    getMyBookings,
    cancelBooking,
    sendBookingOTP,
    updateBookingAddress,
    createOrder,
    verifyPayment,
    repurchaseBooking,
    getBookingById
} = require('../controllers/bookingController');

const {
    protect,
    admin
} = require('../middleware/auth');

const validateAddress = require('../middleware/validateAddress');

router.post(
    '/send-otp',
    protect,
    sendBookingOTP
);

router.post(
    '/',
    protect,
    bookEvent
);

router.get(
    '/my',
    protect,
    getMyBookings
);

router.get(
    '/:id',
    protect,
    getBookingById
);

router.put(
    '/:id/address',
    protect,
    validateAddress,
    updateBookingAddress
);

router.post(
    '/:id/create-order',
    protect,
    createOrder
);

router.post(
    '/:id/verify-payment',
    protect,
    verifyPayment
);

router.post(
    '/:id/repurchase',
    protect,
    repurchaseBooking
);

router.put(
    '/:id/confirm',
    protect,
    admin,
    confirmBooking
);

router.delete(
    '/:id',
    protect,
    cancelBooking
);

module.exports = router;