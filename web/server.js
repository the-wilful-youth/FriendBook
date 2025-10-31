const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database(path.join(__dirname, 'friendbook.db'), (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to SQLite database');
        db.run("PRAGMA journal_mode = WAL");
        db.run("PRAGMA synchronous = NORMAL");
        db.run("PRAGMA cache_size = 10000");
        db.run("PRAGMA temp_store = MEMORY");
        db.run("PRAGMA mmap_size = 268435456");
    }
});

setInterval(() => {
    db.run('PRAGMA wal_checkpoint(FULL)', (err) => {
        if (err) console.error('Checkpoint error:', err);
    });
}, 5000);

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        try {
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
            console.error('Password comparison error:', error);
            res.status(500).json({ error: 'Authentication error' });
        }
    });
});

app.post('/api/register', async (req, res) => {
    const { username, firstName, lastName, password } = req.body;
    
    if (!username || !firstName || !lastName || !password) {
        return res.status(400).json({ error: 'All fields required' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run('INSERT INTO users (username, firstName, lastName, password, isAdmin) VALUES (?, ?, ?, ?, ?)',
            [username, firstName, lastName, hashedPassword, 0], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    res.status(400).json({ error: 'Username already exists' });
                } else {
                    console.error('Registration error:', err);
                    res.status(500).json({ error: 'Registration failed' });
                }
            } else {
                db.run('PRAGMA wal_checkpoint(FULL)');
                res.json({ message: 'Registration successful', id: this.lastID });
            }
        });
    } catch (error) {
        console.error('Hash error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.get('/api/users', (req, res) => {
    db.all('SELECT id, username, firstName, lastName, isAdmin FROM users', (err, users) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Server error' });
        } else {
            res.json(users || []);
        }
    });
});

app.get('/api/friends/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    
    db.all(`SELECT u.id, u.username, u.firstName, u.lastName 
            FROM users u 
            JOIN friendships f ON (u.id = f.user1_id OR u.id = f.user2_id) 
            WHERE (f.user1_id = ? OR f.user2_id = ?) AND u.id != ?`,
        [userId, userId, userId], (err, friends) => {
        if (err) {
            console.error('Database error:', err);
            res.status(500).json({ error: 'Server error' });
        } else {
            res.json(friends || []);
        }
    });
});

app.post('/api/friend-request', (req, res) => {
    const { fromUserId, toUserId } = req.body;
    
    if (!fromUserId || !toUserId) {
        return res.status(400).json({ error: 'User IDs required' });
    }
    
    db.run('INSERT OR IGNORE INTO friend_requests (from_user_id, to_user_id) VALUES (?, ?)',
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
            WHERE fr.from_user_id = ? AND fr.status = 'pending'`,
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
            JOIN users u ON fr.from_user_id = u.id 
            WHERE fr.to_user_id = ? AND fr.status = 'pending'`,
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
    
    db.get('SELECT from_user_id, to_user_id FROM friend_requests WHERE id = ?', [requestId], (err, request) => {
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
                [request.from_user_id, request.to_user_id], (err) => {
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
        const server = app.listen(startPort, () => {
            const port = server.address().port;
            console.log(`🚀 FriendBook server running on http://localhost:${port}`);
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
