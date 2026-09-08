const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authenticateToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public
router.get('/', projectController.getPublicProjects);

// Admin (these will be prefixed with /api/admin/projects in app.js)
router.get('/all', authenticateToken, projectController.getAllProjects);
router.post('/', authenticateToken, upload.single('image'), projectController.createProject);
router.put('/order', authenticateToken, projectController.updateOrder);
router.put('/:id', authenticateToken, upload.single('image'), projectController.updateProject);
router.delete('/:id', authenticateToken, projectController.deleteProject);
router.put('/:id/status', authenticateToken, projectController.updateStatus);

module.exports = router;
