const express = require('express');
const router = express.Router();
const { supportRequest } = require('../controllers/supportController');

router.post('/', supportRequest);

module.exports = router;
