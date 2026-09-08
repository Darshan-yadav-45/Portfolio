const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://portfolio_user:portfolio_password@localhost:5432/portfolio_db',
});

const initDB = async (retries = 10, delay = 2000) => {
    while (retries > 0) {
        try {
            await pool.query('SELECT 1'); // Simple connection test
            console.log('Successfully connected to database.');
            
            await pool.query(`
                CREATE TABLE IF NOT EXISTS admins (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS projects (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    short_description TEXT,
                    detailed_description TEXT,
                    image_url VARCHAR(255),
                    technologies JSONB,
                    features JSONB,
                    github_url VARCHAR(255),
                    live_demo_url VARCHAR(255),
                    featured BOOLEAN DEFAULT false,
                    published BOOLEAN DEFAULT false,
                    display_order INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS contact_messages (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    subject VARCHAR(200),
                    message TEXT NOT NULL,
                    status VARCHAR(20) DEFAULT 'unread',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    fullname VARCHAR(100) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    phone VARCHAR(50),
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS project_requests (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    project_type VARCHAR(100) NOT NULL,
                    description TEXT NOT NULL,
                    timeline VARCHAR(100),
                    budget VARCHAR(100),
                    status VARCHAR(50) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Check if default admin exists
            const adminRes = await pool.query('SELECT * FROM admins WHERE username = $1', ['admin']);
            if (adminRes.rows.length === 0) {
                const hash = await bcrypt.hash('password123', 10);
                await pool.query('INSERT INTO admins (username, password_hash) VALUES ($1, $2)', ['admin', hash]);
                console.log('Default admin created (admin / password123)');
            }

            console.log('Database initialized successfully.');
            return; // Success, exit retry loop
        } catch (err) {
            console.error(`Failed to initialize database. Retries left: ${retries - 1}`, err.message);
            retries -= 1;
            if (retries === 0) {
                console.error('Max retries reached. Database initialization failed.');
            } else {
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }
};

module.exports = {
    pool,
    initDB,
    query: (text, params) => pool.query(text, params),
};
