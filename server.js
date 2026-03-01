require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve base routes for cleaner URLs
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Simple token for demo (in production use JWT)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10
};

let pool;

// Initialize database
async function initDatabase() {
    try {
        // Create pool with railway database
        pool = mysql.createPool(dbConfig);

        // Create tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                icon VARCHAR(10) DEFAULT '📁',
                gradient VARCHAR(255) DEFAULT 'linear-gradient(135deg, #667eea, #764ba2)',
                tags VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS skills (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS education (
                id INT AUTO_INCREMENT PRIMARY KEY,
                year_range VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                institution VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                is_read TINYINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if tables have data, if not seed them
        const [projects] = await pool.query('SELECT COUNT(*) as count FROM projects');
        if (projects[0].count === 0) {
            await seedDatabase();
        }

        console.log('✅ Database initialized successfully!');
    } catch (err) {
        console.error('❌ Database connection error:', err.message);
        console.log('⚠️  Server running without database. Ensure your .env variables are set properly.');
    }
}

async function seedDatabase() {
    try {
        await pool.query(`
            INSERT INTO projects (title, description, icon, gradient, tags) VALUES
            ('E-Commerce Website', 'A responsive online store with product listings, cart, and checkout. Built with HTML, CSS & JavaScript.', '🛒', 'linear-gradient(135deg, #667eea, #764ba2)', 'HTML,CSS,JS'),
            ('Student Management System', 'CRUD app for managing student records with login, search, and report generation.', '📚', 'linear-gradient(135deg, #f093fb, #f5576c)', 'Python,Flask,MySQL'),
            ('Weather Dashboard', 'Real-time weather app with city search and 5-day forecast using a weather API.', '🌤️', 'linear-gradient(135deg, #4facfe, #00f2fe)', 'HTML,CSS,JS'),
            ('Task Manager', 'Desktop app for daily task management with priorities, deadlines, and tracking.', '✅', 'linear-gradient(135deg, #43e97b, #38f9d7)', 'Java,Swing')
        `);

        await pool.query(`
            INSERT INTO skills (name) VALUES
            ('HTML & CSS'), ('JavaScript'), ('Python'), ('Java'),
            ('MySQL'), ('React (Learning)'), ('Git & GitHub'), ('C Programming')
        `);

        await pool.query(`
            INSERT INTO education (year_range, title, institution) VALUES
            ('2023 – Present', 'BCA – Bachelor of Computer Applications', 'University Name'),
            ('2021 – 2023', 'Higher Secondary (12th)', 'School Name'),
            ('2021', 'Secondary School (10th)', 'School Name')
        `);

        console.log('📦 Seed data inserted!');
    } catch (err) {
        console.error('Seed error:', err.message);
    }
}

// ============ API ROUTES ============

// Middleware to check DB availability
app.use('/api', (req, res, next) => {
    if (!pool) {
        // Try to re-init if pool is missing
        return res.status(503).json({
            error: 'Database not connected.',
            details: 'The server is having trouble connecting to Railway MySQL. Please check logs.'
        });
    }
    next();
});

// --- Auth ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Load from env
    const expectedUser = process.env.ADMIN_USER;
    const expectedPass = process.env.ADMIN_PASS;

    if (expectedUser && expectedPass && username === expectedUser && password === expectedPass) {
        res.json({ token: ADMIN_TOKEN });
    } else {
        res.status(401).json({ error: 'Invalid username or password' });
    }
});

// Middleware to protect admin routes
function authenticate(req, res, next) {
    const token = req.headers['authorization'];
    if (token === ADMIN_TOKEN) {
        next();
    } else {
        res.status(403).json({ error: 'Unauthorized' });
    }
}

// --- Projects ---
app.get('/api/projects', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/projects', authenticate, async (req, res) => {
    try {
        const { title, description, icon, gradient, tags } = req.body;
        const [result] = await pool.query(
            'INSERT INTO projects (title, description, icon, gradient, tags) VALUES (?, ?, ?, ?, ?)',
            [title, description, icon || '📁', gradient || 'linear-gradient(135deg, #667eea, #764ba2)', tags]
        );
        res.json({ id: result.insertId, message: 'Project added!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/projects/:id', authenticate, async (req, res) => {
    try {
        const { title, description, icon, gradient, tags } = req.body;
        await pool.query(
            'UPDATE projects SET title=?, description=?, icon=?, gradient=?, tags=? WHERE id=?',
            [title, description, icon, gradient, tags, req.params.id]
        );
        res.json({ message: 'Project updated!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/projects/:id', authenticate, async (req, res) => {
    try {
        await pool.query('DELETE FROM projects WHERE id=?', [req.params.id]);
        res.json({ message: 'Project deleted!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Skills ---
app.get('/api/skills', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM skills ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/skills', authenticate, async (req, res) => {
    try {
        const { name } = req.body;
        const [result] = await pool.query('INSERT INTO skills (name) VALUES (?)', [name]);
        res.json({ id: result.insertId, message: 'Skill added!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/skills/:id', authenticate, async (req, res) => {
    try {
        await pool.query('DELETE FROM skills WHERE id=?', [req.params.id]);
        res.json({ message: 'Skill deleted!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Education ---
app.get('/api/education', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM education ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/education', authenticate, async (req, res) => {
    try {
        const { year_range, title, institution } = req.body;
        const [result] = await pool.query(
            'INSERT INTO education (year_range, title, institution) VALUES (?, ?, ?)',
            [year_range, title, institution]
        );
        res.json({ id: result.insertId, message: 'Education added!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/education/:id', authenticate, async (req, res) => {
    try {
        const { year_range, title, institution } = req.body;
        await pool.query(
            'UPDATE education SET year_range=?, title=?, institution=? WHERE id=?',
            [year_range, title, institution, req.params.id]
        );
        res.json({ message: 'Education updated!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/education/:id', authenticate, async (req, res) => {
    try {
        await pool.query('DELETE FROM education WHERE id=?', [req.params.id]);
        res.json({ message: 'Education deleted!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Messages ---
app.get('/api/messages', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/messages', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        const [result] = await pool.query(
            'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
            [name, email, message]
        );
        res.json({ id: result.insertId, message: 'Message sent!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/messages/:id/read', authenticate, async (req, res) => {
    try {
        await pool.query('UPDATE messages SET is_read=1 WHERE id=?', [req.params.id]);
        res.json({ message: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/messages/:id', authenticate, async (req, res) => {
    try {
        await pool.query('DELETE FROM messages WHERE id=?', [req.params.id]);
        res.json({ message: 'Message deleted!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Stats for admin dashboard ---
app.get('/api/stats', authenticate, async (req, res) => {
    try {
        const [projects] = await pool.query('SELECT COUNT(*) as count FROM projects');
        const [skills] = await pool.query('SELECT COUNT(*) as count FROM skills');
        const [education] = await pool.query('SELECT COUNT(*) as count FROM education');
        const [messages] = await pool.query('SELECT COUNT(*) as count FROM messages');
        const [unread] = await pool.query('SELECT COUNT(*) as count FROM messages WHERE is_read=0');
        res.json({
            projects: projects[0].count,
            skills: skills[0].count,
            education: education[0].count,
            messages: messages[0].count,
            unreadMessages: unread[0].count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Start server (works even without DB)
app.listen(PORT, () => {
    console.log(`\n🚀 Portfolio server running at http://localhost:${PORT}`);
    console.log(`📋 Admin panel at http://localhost:${PORT}/admin\n`);
});

initDatabase();

