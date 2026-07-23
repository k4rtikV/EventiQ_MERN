const express = require('express');

const {
    subscribeToNewsletter,
    getNewsletterDashboard,
    updateSubscriberStatus,
    deleteSubscriber,
    sendNewsletterCampaign
} = require('../controllers/newsletterController');

const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.post('/subscribe', subscribeToNewsletter);

router.get('/admin/dashboard', protect, admin, getNewsletterDashboard);
router.post('/admin/send', protect, admin, sendNewsletterCampaign);
router.put('/admin/subscribers/:id/status', protect, admin, updateSubscriberStatus);
router.delete('/admin/subscribers/:id', protect, admin, deleteSubscriber);

module.exports = router;
