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

        // Create admin user if it doesn't exist
        const adminExists = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
        if (!adminExists) {
            await db.run('INSERT INTO users (username, firstName, lastName, password, isAdmin) VALUES (?, ?, ?, ?, ?)',
                ['admin', 'Admin', 'User', 'admin123', 1]);
            console.log('Admin user created');
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
    
    if (req.method === 'POST') {
        try {
            // Initialize database on first request
            await initDatabase();
            
            const { username, password } = req.body;
            console.log('Login attempt:', username);
            
            const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
            console.log('User found:', user ? 'Yes' : 'No');
            
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
            res.status(500).json({ error: 'Login failed: ' + error.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
