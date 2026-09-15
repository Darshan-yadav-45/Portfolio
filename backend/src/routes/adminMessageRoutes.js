const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authorizeAdmin } = require('../middleware/authMiddleware');

// All routes are protected by authenticateToken in app.js or here. Let's do it here or in app.js.
// We'll apply it in app.js, so we just map the routes here.

router.get('/', contactController.getMessages);
router.put('/:id/status', contactController.updateMessageStatus);
router.delete('/:id', contactController.deleteMessage);

module.exports = router;
