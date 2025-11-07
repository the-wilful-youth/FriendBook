const { DatabaseWrapper } = require('../web/db-config');

const db = new DatabaseWrapper();

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

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Initialize database on first request
    await initDatabase();
    
    if (req.method === 'POST') {
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
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
