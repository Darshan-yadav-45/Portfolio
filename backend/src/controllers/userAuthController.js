const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY || 'your_super_secret_jwt_key';

const register = async (req, res) => {
    const { fullname, email, phone, password } = req.body;
    
    try {
        // Check if user already exists
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ detail: 'Email is already registered.' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert new user
        await db.query(
            'INSERT INTO users (fullname, email, phone, password_hash) VALUES ($1, $2, $3, $4)',
            [fullname, email, phone, passwordHash]
        );

        res.status(201).json({ message: 'Account created successfully.' });
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ detail: 'Server error. Please try again later.' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // 1. Check if it's the Admin
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
        
        if (adminEmail && email === adminEmail) {
            if (adminPasswordHash && await bcrypt.compare(password, adminPasswordHash)) {
                const token = jwt.sign({ email: adminEmail, role: 'admin' }, SECRET_KEY, { expiresIn: '24h' });
                return res.json({ token, user: { email: adminEmail, role: 'admin' } });
            } else {
                return res.status(401).json({ detail: 'Invalid email or password.' });
            }
        }

        // 2. Fallback to users table
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        
        if (!user) {
            return res.status(404).json({ detail: 'Account not found. Please register first.' });
        }
        
        if (await bcrypt.compare(password, user.password_hash)) {
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, SECRET_KEY, { expiresIn: '24h' });
            res.json({ token, user: { id: user.id, fullname: user.fullname, email: user.email, role: user.role || 'user' } });
        } else {
            res.status(401).json({ detail: 'Invalid email or password.' });
        }
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ detail: 'Server error. Please try again later.' });
    }
};

module.exports = { register, login };
