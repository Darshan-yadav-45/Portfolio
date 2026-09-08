const express = require('express');
const router = express.Router();
const projectRequestController = require('../controllers/projectRequestController');

// Using authMiddleware in app.js for these routes
router.post('/', projectRequestController.submitProjectRequest);

module.exports = router;
