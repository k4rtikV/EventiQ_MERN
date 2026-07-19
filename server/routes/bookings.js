const express = require('express');
const router = express.Router();

const {
    sendBookingOTP,
    bookEvent,
    getBookingById,
    updateBookingAddress,
    applyPromoCode,
    removePromoCode,
    createOrder,
    verifyPayment,
    getMyBookings,
    getMyPaymentHistory,
    cancelBooking,
    repurchaseBooking
} = require('../controllers/bookingController');

const { protect } = require('../middleware/auth');

const {
    downloadInvoice
} = require('../controllers/invoiceController');

/*
|--------------------------------------------------------------------------
| Named routes
|--------------------------------------------------------------------------
|
| These must remain above "/:id".
|
*/

router.post('/otp', protect, sendBookingOTP);

router.post('/', protect, bookEvent);

/*
|--------------------------------------------------------------------------
| User bookings
|--------------------------------------------------------------------------
|
| Your UserDashboard currently requests:
| GET /api/bookings/my
|
*/

router.get('/my', protect, getMyBookings);

/*
|--------------------------------------------------------------------------
| Optional compatibility route
|--------------------------------------------------------------------------
*/

router.get('/my-bookings', protect, getMyBookings);

/*
|--------------------------------------------------------------------------
| Payment history
|--------------------------------------------------------------------------
*/

router.get(
    '/my/payment-history',
    protect,
    getMyPaymentHistory
);

/*
|--------------------------------------------------------------------------
| Booking-specific routes
|--------------------------------------------------------------------------
*/

router.get(
    '/:id/invoice',
    protect,
    downloadInvoice
);

router.put(
    '/:id/address',
    protect,
    updateBookingAddress
);

router.post(
    '/:id/promo',
    protect,
    applyPromoCode
);

router.delete(
    '/:id/promo',
    protect,
    removePromoCode
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
    '/:id/cancel',
    protect,
    cancelBooking
);

/*
|--------------------------------------------------------------------------
| Dynamic booking ID route
|--------------------------------------------------------------------------
|
| This must always remain last.
|
*/

router.get(
    '/:id',
    protect,
    getBookingById
);

module.exports = router;