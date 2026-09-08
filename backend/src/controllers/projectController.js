const db = require('../config/database');
const path = require('path');
const fs = require('fs');

const getPublicProjects = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM projects WHERE published = true ORDER BY display_order ASC, created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

const getAllProjects = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM projects ORDER BY display_order ASC, created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

const createProject = async (req, res) => {
    const { title, category, short_description, detailed_description, github_url, live_demo_url, featured, published, display_order, technologies, features } = req.body;
    
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const isFeatured = featured === 'true' || featured === true;
    const isPublished = published === 'true' || published === true;
    const order = parseInt(display_order) || 0;
    
    try {
        const result = await db.query(
            `INSERT INTO projects 
            (title, category, short_description, detailed_description, image_url, technologies, features, github_url, live_demo_url, featured, published, display_order) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [title, category, short_description, detailed_description, imageUrl, technologies, features, github_url, live_demo_url, isFeatured, isPublished, order]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create project' });
    }
};

const updateProject = async (req, res) => {
    const { id } = req.params;
    const { title, category, short_description, detailed_description, github_url, live_demo_url, featured, published, display_order, technologies, features } = req.body;
    
    const isFeatured = featured === 'true' || featured === true;
    const isPublished = published === 'true' || published === true;
    const order = parseInt(display_order) || 0;

    try {
        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        let query, params;
        if (imageUrl) {
            query = `UPDATE projects SET 
                title = $1, category = $2, short_description = $3, detailed_description = $4, image_url = $5, technologies = $6, features = $7, github_url = $8, live_demo_url = $9, featured = $10, published = $11, display_order = $12, updated_at = CURRENT_TIMESTAMP
                WHERE id = $13 RETURNING *`;
            params = [title, category, short_description, detailed_description, imageUrl, technologies, features, github_url, live_demo_url, isFeatured, isPublished, order, id];
        } else {
            query = `UPDATE projects SET 
                title = $1, category = $2, short_description = $3, detailed_description = $4, technologies = $5, features = $6, github_url = $7, live_demo_url = $8, featured = $9, published = $10, display_order = $11, updated_at = CURRENT_TIMESTAMP
                WHERE id = $12 RETURNING *`;
            params = [title, category, short_description, detailed_description, technologies, features, github_url, live_demo_url, isFeatured, isPublished, order, id];
        }

        const result = await db.query(query, params);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update project' });
    }
};

const deleteProject = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM projects WHERE id = $1 RETURNING image_url', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
        
        const imageUrl = result.rows[0].image_url;
        if (imageUrl) {
            const filePath = path.join(__dirname, '../../../', imageUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
};

const updateStatus = async (req, res) => {
    const { id } = req.params;
    const { published } = req.body;
    try {
        const result = await db.query('UPDATE projects SET published = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [published, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update status' });
    }
};

const updateOrder = async (req, res) => {
    const { orders } = req.body;
    try {
        for (let item of orders) {
            await db.query('UPDATE projects SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [item.display_order, item.id]);
        }
        res.json({ message: 'Order updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update order' });
    }
};

module.exports = {
    getPublicProjects,
    getAllProjects,
    createProject,
    updateProject,
    deleteProject,
    updateStatus,
    updateOrder
};
