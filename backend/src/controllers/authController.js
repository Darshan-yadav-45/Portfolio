const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY || 'your_super_secret_jwt_key';

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
        const admin = result.rows[0];
        
        if (admin && await bcrypt.compare(password, admin.password_hash)) {
            const token = jwt.sign({ id: admin.id, username: admin.username }, SECRET_KEY, { expiresIn: '24h' });
            res.json({ token });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { login };
