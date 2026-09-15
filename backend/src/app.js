const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Trust proxy for express-rate-limit when behind Nginx
app.set('trust proxy', 1);

// Routes
const projectRoutes = require('./routes/projectRoutes');
const contactRoutes = require('./routes/contactRoutes');
const adminMessageRoutes = require('./routes/adminMessageRoutes');
const userAuthRoutes = require('./routes/userAuthRoutes');
const projectRequestRoutes = require('./routes/projectRequestRoutes');

app.use('/api/projects', projectRoutes); // Public /api/projects
app.use('/api/contact', contactRoutes); // Public contact form
app.use('/api', userAuthRoutes); // Public user registration and login

// Admin projects mapping
const { authenticateToken, authorizeAdmin } = require('./middleware/authMiddleware');
const upload = require('./middleware/uploadMiddleware');
const projectController = require('./controllers/projectController');

app.get('/api/admin/projects', authorizeAdmin, projectController.getAllProjects);
app.post('/api/admin/projects', authorizeAdmin, upload.single('image'), projectController.createProject);
app.put('/api/admin/projects/order', authorizeAdmin, projectController.updateOrder);
app.put('/api/admin/projects/:id', authorizeAdmin, upload.single('image'), projectController.updateProject);
app.delete('/api/admin/projects/:id', authorizeAdmin, projectController.deleteProject);
app.put('/api/admin/projects/:id/status', authorizeAdmin, projectController.updateStatus);

app.use('/api/project-requests', authenticateToken, projectRequestRoutes);

app.use('/api/admin/messages', authorizeAdmin, adminMessageRoutes);

// Init DB
db.initDB();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on port ${PORT}`);
});
