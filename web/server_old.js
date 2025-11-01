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
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database tables
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
        // Check if username already exists
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

// Admin: Delete user
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

// Admin: Add user
app.post('/api/admin/users', async (req, res) => {
    const { username, firstName, lastName, password, isAdmin } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run('INSERT INTO users (username, firstName, lastName, password, isAdmin) VALUES (?, ?, ?, ?, ?)',
            [username, firstName, lastName, hashedPassword, isAdmin ? 1 : 0]);
        res.json({ success: true, id: result.id, message: 'User created successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Username already exists' });
    }
});

// Admin: Clear database
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

app.post('/api/friend-request', (req, res) => {
    const { fromUserId, toUserId } = req.body;
    
    if (!fromUserId || !toUserId) {
        return res.status(400).json({ error: 'User IDs required' });
    }
    
    db.run('INSERT OR IGNORE INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)',
        [fromUserId, toUserId], function(err) {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Failed to send request' });
        } else {
            db.run('PRAGMA wal_checkpoint(FULL)');
            res.json({ message: 'Friend request sent' });
        }
    });
});

app.get('/api/sent-requests/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    
    db.all(`SELECT fr.id, fr.to_user_id, u.username, u.firstName, u.lastName 
            FROM friend_requests fr 
            JOIN users u ON fr.to_user_id = u.id 
            WHERE fr.sender_id = ? AND fr.status = 'pending'`,
        [userId], (err, requests) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Server error' });
        } else {
            res.json(requests || []);
        }
    });
});

app.get('/api/friend-requests/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    
    db.all(`SELECT fr.id, u.username, u.firstName, u.lastName 
            FROM friend_requests fr 
            JOIN users u ON fr.sender_id = u.id 
            WHERE fr.receiver_id = ? AND fr.status = 'pending'`,
        [userId], (err, requests) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Server error' });
        } else {
            res.json(requests || []);
        }
    });
});

app.post('/api/accept-request', (req, res) => {
    const { requestId } = req.body;
    
    if (!requestId) {
        return res.status(400).json({ error: 'Request ID required' });
    }
    
    db.get('SELECT sender_id, receiver_id FROM friend_requests WHERE id = ?', [requestId], (err, request) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        db.run('UPDATE friend_requests SET status = "accepted" WHERE id = ?', [requestId], (err) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to accept request' });
            }
            
            db.run('INSERT OR IGNORE INTO friendships (user1_id, user2_id) VALUES (?, ?)',
                [request.sender_id, request.receiver_id], (err) => {
                if (err) {
                    console.error('Database error:', err);
                    res.status(500).json({ error: 'Failed to create friendship' });
                } else {
                    db.run('PRAGMA wal_checkpoint(FULL)');
                    res.json({ message: 'Friend request accepted' });
                }
            });
        });
    });
});

function findAvailablePort(startPort) {
    return new Promise((resolve) => {
        const server = app.listen(startPort, '0.0.0.0', () => {
            const port = server.address().port;
            console.log(`🚀 FriendBook server running on http://localhost:${port}`);
            console.log(`🌐 Network access: http://YOUR_IP:${port}`);
            resolve(server);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${startPort} is busy, trying ${startPort + 1}...`);
                findAvailablePort(startPort + 1).then(resolve);
            } else {
                console.error('Server error:', err);
            }
        });
    });
}

findAvailablePort(3000);
