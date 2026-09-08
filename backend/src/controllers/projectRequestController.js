const db = require('../config/database');

const submitProjectRequest = async (req, res) => {
    const { project_type, description, timeline, budget } = req.body;
    
    // Extracted from authMiddleware if token is verified
    const user_id = req.user ? req.user.id : null;

    if (!project_type || !description) {
        return res.status(400).json({ detail: 'Project type and description are required.' });
    }

    try {
        await db.query(
            'INSERT INTO project_requests (user_id, project_type, description, timeline, budget) VALUES ($1, $2, $3, $4, $5)',
            [user_id, project_type, description, timeline, budget]
        );

        res.status(201).json({ message: 'Project request submitted successfully.' });
    } catch (err) {
        console.error('Submit Project Request Error:', err);
        res.status(500).json({ detail: 'Server error. Please try again later.' });
    }
};

module.exports = { submitProjectRequest };
