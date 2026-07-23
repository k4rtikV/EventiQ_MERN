const express = require('express');
const router = express.Router();
const {
    supportRequest,
    ticketDelaySupportRequest,
    refundDelaySupportRequest,
    getAdminDelayedRequests,
    updateDelayedRequest
} = require('../controllers/supportController');
const { protect, admin } = require('../middleware/auth');

router.post('/', supportRequest);
router.post('/ticket-delay/:bookingId', protect, ticketDelaySupportRequest);
router.post('/refund-delay/:bookingId', protect, refundDelaySupportRequest);
router.get('/admin/requests', protect, admin, getAdminDelayedRequests);
router.put('/admin/requests/:requestId', protect, admin, updateDelayedRequest);

module.exports = router;
