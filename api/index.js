const express = require('express');
const cors = require('cors');
const path = require('path');
const { DatabaseWrapper } = require('../web/db-config');

const app = express();
const db = new DatabaseWrapper();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../web/public')));

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
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../web/public/index.html'));
});

app.post('/api/login', async (req, res) => {
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
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/register', async (req, res) => {
    const { username, firstName, lastName, password } = req.body;
    
    try {
        const existingUser = await db.get('SELECT username FROM users WHERE username = ?', [username]);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        await db.run('INSERT INTO users (username, firstName, lastName, password, isAdmin) VALUES (?, ?, ?, ?, ?)',
            [username, firstName, lastName, password, 0]);
        
        res.json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Initialize database on startup
initDatabase();

module.exports = app;
