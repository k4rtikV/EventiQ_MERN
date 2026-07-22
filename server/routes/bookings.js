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
    getAllBookings,
    confirmBooking,
    cancelBooking,
    repurchaseBooking
} = require('../controllers/bookingController');

const {
    protect,
    admin
} = require('../middleware/auth');

const validateAddress = require(
    '../middleware/validateAddress'
);

const {
    downloadInvoice
} = require('../controllers/invoiceController');

/*
|--------------------------------------------------------------------------
| Named routes
|--------------------------------------------------------------------------
|
| Keep all named routes above the dynamic "/:id" route.
|
*/

router.post(
    '/send-otp',
    protect,
    sendBookingOTP
);

router.post(
    '/otp',
    protect,
    sendBookingOTP
);

router.post(
    '/',
    protect,
    bookEvent
);

/*
|--------------------------------------------------------------------------
| User booking routes
|--------------------------------------------------------------------------
*/

router.get(
    '/my',
    protect,
    getMyBookings
);

router.get(
    '/my-bookings',
    protect,
    getMyBookings
);

router.get(
    '/my/payment-history',
    protect,
    getMyPaymentHistory
);

/*
|--------------------------------------------------------------------------
| Admin booking routes
|--------------------------------------------------------------------------
*/

router.get(
    '/admin/all',
    protect,
    admin,
    getAllBookings
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
    validateAddress,
    updateBookingAddress
);

router.post(
    '/:id/apply-promo',
    protect,
    applyPromoCode
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

/*
|--------------------------------------------------------------------------
| Admin booking actions
|--------------------------------------------------------------------------
*/

router.put(
    '/:id/confirm',
    protect,
    admin,
    confirmBooking
);

/*
|--------------------------------------------------------------------------
| Cancellation routes
|--------------------------------------------------------------------------
|
| Both normal users and admins may reach these routes.
|
| The cancelBooking controller itself checks whether:
| 1. The authenticated user owns the booking, or
| 2. The authenticated user is an admin.
|
| Therefore, the admin middleware must not be used here.
|
*/

/*
 * Used by any frontend that sends:
 *
 * PUT /api/bookings/:id/cancel
 */
router.put(
    '/:id/cancel',
    protect,
    cancelBooking
);

/*
 * Used by the current UserDashboard:
 *
 * DELETE /api/bookings/:id
 *
 * Admin pages may also continue using this route to reject or
 * cancel a booking. Authorization is handled inside cancelBooking.
 */
router.delete(
    '/:id',
    protect,
    cancelBooking
);

/*
|--------------------------------------------------------------------------
| Dynamic booking route
|--------------------------------------------------------------------------
|
| This must stay last. Otherwise values such as "my" and "admin" may be
| treated as MongoDB booking IDs.
|
*/

router.get(
    '/:id',
    protect,
    getBookingById
);

module.exports = router;