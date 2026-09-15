const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authorizeAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public
router.get('/', projectController.getPublicProjects);

// Admin (these will be prefixed with /api/admin/projects in app.js)
router.get('/all', authorizeAdmin, projectController.getAllProjects);
router.post('/', authorizeAdmin, upload.single('image'), projectController.createProject);
router.put('/order', authorizeAdmin, projectController.updateOrder);
router.put('/:id', authorizeAdmin, upload.single('image'), projectController.updateProject);
router.delete('/:id', authorizeAdmin, projectController.deleteProject);
router.put('/:id/status', authorizeAdmin, projectController.updateStatus);

module.exports = router;
