require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { body, param, validationResult } = require('express-validator');
const path = require('path');
const { DatabaseWrapper } = require('./db-config');

const app = express();
const db = new DatabaseWrapper();

// Trust proxy for deployment on Render/Railway/etc
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));
app.use(rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 1000,  // Increased from 100 to 1000 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// JWT functions
const JWT_SECRET = process.env.JWT_SECRET || 'friendbook-secret';
const generateToken = (user) => jwt.sign({ id: user.id, username: user.username, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '24h' });
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try { req.user = jwt.verify(token, JWT_SECRET); next(); } catch { res.status(400).json({ error: 'Invalid token' }); }
};
const adminAuth = (req, res, next) => req.user?.isAdmin ? next() : res.status(403).json({ error: 'Admin access required' });

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }
    next();
};

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

app.post('/api/login', [
    body('username').trim().isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/),
    body('password').isLength({ min: 6, max: 100 })
], validate, async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = generateToken(user);
        res.json({
            token,
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
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/register', [
    body('username').trim().isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/),
    body('firstName').trim().isLength({ min: 1, max: 50 }).matches(/^[a-zA-Z\s]+$/),
    body('lastName').trim().isLength({ min: 1, max: 50 }).matches(/^[a-zA-Z\s]+$/),
    body('password').isLength({ min: 6, max: 100 })
], validate, async (req, res) => {
    const { username, firstName, lastName, password } = req.body;
    
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

app.get('/api/users', auth, async (req, res) => {
    try {
        const users = await db.query('SELECT id, username, firstName, lastName, isAdmin FROM users');
        res.json(users || []);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/friends/:userId', auth, async (req, res) => {
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

app.post('/api/friend-request', [
    body('fromUserId').isInt({ min: 1 }),
    body('toUserId').isInt({ min: 1 })
], validate, auth, async (req, res) => {
    const { fromUserId, toUserId } = req.body;
    
    try {
        // Check if target user is admin
        const targetUser = await db.get('SELECT isAdmin FROM users WHERE id = ?', [toUserId]);
        if (targetUser && targetUser.isAdmin) {
            return res.status(400).json({ error: 'Cannot send friend requests to admin users' });
        }
        
        await db.run('INSERT OR IGNORE INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)', [fromUserId, toUserId]);
        res.json({ message: 'Friend request sent' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to send request' });
    }
});

app.get('/api/sent-requests/:userId', auth, async (req, res) => {
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

app.get('/api/friend-requests/:userId', auth, async (req, res) => {
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

app.post('/api/accept-request/:requestId', [
    param('requestId').isInt({ min: 1 })
], validate, auth, async (req, res) => {
    const requestId = parseInt(req.params.requestId);
    
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

app.delete('/api/remove-friend', [
    body('userId').isInt({ min: 1 }),
    body('friendId').isInt({ min: 1 })
], validate, auth, async (req, res) => {
    const { userId, friendId } = req.body;
    
    try {
        // Remove friendship (works both ways due to OR condition)
        await db.run('DELETE FROM friendships WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)', 
            [userId, friendId, friendId, userId]);
        
        res.json({ message: 'Friend removed successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to remove friend' });
    }
});

app.get('/api/smart-suggestions/:userId', auth, async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    try {
        // Get user's direct friends
        const userFriends = await db.query(`
            SELECT CASE 
                WHEN user1_id = ? THEN user2_id 
                ELSE user1_id 
            END as friend_id
            FROM friendships 
            WHERE user1_id = ? OR user2_id = ?
        `, [userId, userId, userId]);
        
        const friendIds = new Set(userFriends.map(f => f.friend_id));
        const userFriendCount = friendIds.size;
        
        // Get pending/sent requests to exclude
        const [sentRequests, receivedRequests] = await Promise.all([
            db.query('SELECT receiver_id FROM friend_requests WHERE sender_id = ?', [userId]),
            db.query('SELECT sender_id FROM friend_requests WHERE receiver_id = ?', [userId])
        ]);
        
        const excludeIds = new Set([
            userId,
            ...friendIds,
            ...sentRequests.map(r => r.receiver_id),
            ...receivedRequests.map(r => r.sender_id)
        ]);
        
        // Get all users with friend count
        const allUsers = await db.query(`
            SELECT u.id, u.username, u.firstName, u.lastName,
                   (SELECT COUNT(*) FROM friendships f 
                    WHERE f.user1_id = u.id OR f.user2_id = u.id) as friend_count
            FROM users u 
            WHERE u.isAdmin = 0
        `);
        const potentialSuggestions = allUsers.filter(user => !excludeIds.has(user.id));
        
        // Calculate enhanced scores for suggestions
        const suggestionsWithScores = await Promise.all(
            potentialSuggestions.map(async (user) => {
                // Count mutual friends
                let mutualCount = 0;
                const candidateFriends = await db.query(`
                    SELECT CASE 
                        WHEN user1_id = ? THEN user2_id 
                        ELSE user1_id 
                    END as friend_id
                    FROM friendships 
                    WHERE user1_id = ? OR user2_id = ?
                `, [user.id, user.id, user.id]);
                
                const candidateFriendIds = new Set(candidateFriends.map(f => f.friend_id));
                for (const fid of friendIds) {
                    if (candidateFriendIds.has(fid)) mutualCount++;
                }
                
                // Calculate network distance
                let distance = mutualCount > 0 ? 2 : 0;
                
                // Calculate smart score using multiple factors
                let score = 0;
                
                // Factor 1: Mutual friends (50% weight)
                score += mutualCount * 5.0;
                
                // Factor 2: Network distance (20% weight)
                if (distance === 2) {
                    score += 3.0;
                }
                
                // Factor 3: Balanced popularity (15% weight)
                if (userFriendCount > 0) {
                    const popularityRatio = user.friend_count / userFriendCount;
                    const balancedRatio = popularityRatio > 1 ? 1 / popularityRatio : popularityRatio;
                    score += balancedRatio * 2.0;
                }
                
                // Factor 4: Active user bonus (15% weight)
                if (user.friend_count >= 2 && user.friend_count <= 20) {
                    score += 2.0;
                } else if (user.friend_count > 20) {
                    score += 0.5;
                }
                
                // Add small randomness for variety
                score += Math.random() * 0.5;
                
                return {
                    id: user.id,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    mutual_friends: mutualCount,
                    friend_count: user.friend_count,
                    distance: distance,
                    suggestion_score: score
                };
            })
        );
        
        // Filter and sort suggestions
        const rankedSuggestions = suggestionsWithScores
            .filter(s => s.mutual_friends > 0 || s.distance === 2) // Only meaningful connections
            .sort((a, b) => b.suggestion_score - a.suggestion_score)
            .slice(0, 12); // Increased from 10 for better variety
        
        res.json(rankedSuggestions);
    } catch (error) {
        console.error('Smart suggestions error:', error);
        res.status(500).json({ error: 'Failed to load suggestions' });
    }
});

app.delete('/api/admin/users/:id', [
    param('id').isInt({ min: 1 })
], validate, auth, adminAuth, async (req, res) => {
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

app.post('/api/admin/users', [
    body('username').trim().isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/),
    body('firstName').trim().isLength({ min: 1, max: 50 }).matches(/^[a-zA-Z\s]+$/),
    body('lastName').trim().isLength({ min: 1, max: 50 }).matches(/^[a-zA-Z\s]+$/),
    body('password').isLength({ min: 6, max: 100 }),
    body('isAdmin').optional().isIn([true, false, 'true', 'false', 1, 0])
], validate, auth, adminAuth, async (req, res) => {
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

app.delete('/api/admin/clear', auth, adminAuth, async (req, res) => {
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
