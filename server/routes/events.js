const express = require('express');

const {
    getEvents,
    getEventById,
    getEventImage,
    createEvent,
    updateEvent,
    deleteEvent
} = require('../controllers/eventController');

const {
    protect,
    admin
} = require('../middleware/auth');

const router = express.Router();

router.get('/', getEvents);

/*
 * Keep this route before router.get('/:id').
 */
router.get('/:id/image', getEventImage);

router.get('/:id', getEventById);

router.post(
    '/',
    protect,
    admin,
    createEvent
);

router.put(
    '/:id',
    protect,
    admin,
    updateEvent
);

router.delete(
    '/:id',
    protect,
    admin,
    deleteEvent
);

module.exports = router;