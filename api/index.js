const express = require('express');
const cors = require('cors');
const { DatabaseWrapper } = require('../web/db-config');

const app = express();
const db = new DatabaseWrapper();

app.use(cors({
    origin: ['http://localhost:3000', 'https://your-vercel-domain.vercel.app'],
    credentials: true
}));
app.use(express.json());

// Initialize database
async function initDatabase() {
    try {
        await db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            firstName TEXT NOT NULL,
            lastName TEXT NOT NULL,
            password TEXT NOT NULL,
            isAdmin INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.run(`CREATE TABLE IF NOT EXISTS friendships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user1_id INTEGER NOT NULL,
            user2_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user1_id, user2_id)
        )`);

        await db.run(`CREATE TABLE IF NOT EXISTS friend_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(sender_id, receiver_id)
        )`);

        // Create admin user if it doesn't exist
        const adminExists = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
        if (!adminExists) {
            await db.run('INSERT INTO users (username, firstName, lastName, password, isAdmin) VALUES (?, ?, ?, ?, ?)',
                ['admin', 'Admin', 'User', 'admin123', 1]);
        }
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Routes
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        
        if (!user || password !== user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        res.json({ 
            success: true, 
            user: { 
                id: user.id, 
                username: user.username, 
                firstName: user.firstName, 
                lastName: user.lastName,
                isAdmin: user.isAdmin 
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/register', async (req, res) => {
    const { username, firstName, lastName, password } = req.body;
    
    try {
        const existingUser = await db.get('SELECT username FROM users WHERE username = ?', [username]);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const isAdmin = username === 'admin' ? 1 : 0;
        
        await db.run('INSERT INTO users (username, firstName, lastName, password, isAdmin) VALUES (?, ?, ?, ?, ?)',
            [username, firstName, lastName, password, isAdmin]);
        
        res.json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.get('/users', async (req, res) => {
    try {
        const users = await db.query('SELECT id, username, firstName, lastName, isAdmin, created_at FROM users');
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Initialize database on startup
initDatabase();

// For Vercel serverless functions
module.exports = app;
