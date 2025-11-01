require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const { DatabaseWrapper } = require('./db-config');

const app = express();
const db = new DatabaseWrapper();

app.use(cors());
app.use(express.json());
const fs = require('fs');

// Add debug logging
const publicPath = path.join(__dirname, 'public');
console.log('Public directory:', publicPath);
console.log('Directory exists:', fs.existsSync(publicPath));
console.log('Files in public:', fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : 'Directory not found');

app.use(express.static(publicPath));

// Serve index.html for root route
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send('<h1>FriendBook</h1><p>Static files not found. API is running.</p>');
    }
});

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
        
        console.log('✅ Database tables initialized');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

initDatabase();

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    try {
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        res.json({
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: user.isAdmin
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/register', async (req, res) => {
    const { username, firstName, lastName, password } = req.body;
    
    if (!username || !firstName || !lastName || !password) {
        return res.status(400).json({ error: 'All fields required' });
    }
    
    try {
        const existingUser = await db.get('SELECT username FROM users WHERE username = ?', [username]);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run('INSERT INTO users (username, firstName, lastName, password, isAdmin) VALUES (?, ?, ?, ?, ?)',
            [username, firstName, lastName, hashedPassword, 0]);
        
        res.json({ 
            success: true, 
            message: 'Registration successful'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await db.query('SELECT id, username, firstName, lastName, isAdmin FROM users');
        res.json(users || []);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/friends/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    try {
        const friends = await db.query(`SELECT u.id, u.username, u.firstName, u.lastName 
            FROM users u 
            JOIN friendships f ON (u.id = f.user1_id OR u.id = f.user2_id) 
            WHERE (f.user1_id = ? OR f.user2_id = ?) AND u.id != ?`, [userId, userId, userId]);
        res.json(friends || []);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/friend-request', async (req, res) => {
    const { fromUserId, toUserId } = req.body;
    
    if (!fromUserId || !toUserId) {
        return res.status(400).json({ error: 'User IDs required' });
    }
    
    try {
        await db.run('INSERT OR IGNORE INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)', [fromUserId, toUserId]);
        res.json({ message: 'Friend request sent' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to send request' });
    }
});

app.get('/api/sent-requests/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    try {
        const requests = await db.query(`SELECT fr.id, fr.receiver_id, u.username, u.firstName, u.lastName 
            FROM friend_requests fr 
            JOIN users u ON fr.receiver_id = u.id 
            WHERE fr.sender_id = ? AND fr.status = 'pending'`, [userId]);
        res.json(requests || []);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/friend-requests/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    try {
        const requests = await db.query(`SELECT fr.id, u.username, u.firstName, u.lastName 
            FROM friend_requests fr 
            JOIN users u ON fr.sender_id = u.id 
            WHERE fr.receiver_id = ? AND fr.status = 'pending'`, [userId]);
        res.json(requests || []);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/accept-request/:requestId', async (req, res) => {
    const requestId = parseInt(req.params.requestId);
    
    if (!requestId) {
        return res.status(400).json({ error: 'Request ID required' });
    }
    
    try {
        const request = await db.get('SELECT sender_id, receiver_id FROM friend_requests WHERE id = ?', [requestId]);
        
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        await db.run('INSERT OR IGNORE INTO friendships (user1_id, user2_id) VALUES (?, ?)', [request.sender_id, request.receiver_id]);
        await db.run('DELETE FROM friend_requests WHERE id = ?', [requestId]);
        
        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to accept request' });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    
    try {
        await db.run('DELETE FROM friendships WHERE user1_id = ? OR user2_id = ?', [userId, userId]);
        await db.run('DELETE FROM friend_requests WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
        await db.run('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

app.post('/api/admin/users', async (req, res) => {
    const { username, firstName, lastName, password, isAdmin } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run('INSERT INTO users (username, firstName, lastName, password, isAdmin) VALUES (?, ?, ?, ?, ?)',
            [username, firstName, lastName, hashedPassword, isAdmin ? 1 : 0]);
        res.json({ success: true, message: 'User created successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Username already exists' });
    }
});

app.delete('/api/admin/clear', async (req, res) => {
    try {
        await db.run('DELETE FROM friendships');
        await db.run('DELETE FROM friend_requests');
        await db.run('DELETE FROM users WHERE username != "admin"');
        res.json({ success: true, message: 'Database cleared successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear database' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 FriendBook server running on port ${PORT}`);
    console.log(`🌐 ${db.isOnline ? 'Using Turso online database' : 'Using local SQLite database'}`);
});
