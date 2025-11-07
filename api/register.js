module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'POST') {
        try {
            const { username, firstName, lastName, password } = req.body;
            console.log('Registration attempt for:', username);
            
            // Check if we have Turso credentials
            if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
                console.log('No Turso credentials, registration not available');
                return res.status(500).json({ error: 'Registration not available in demo mode' });
            }
            
            // Use Turso database
            const { createClient } = require('@libsql/client');
            const client = createClient({
                url: process.env.TURSO_DATABASE_URL,
                authToken: process.env.TURSO_AUTH_TOKEN
            });
            
            // Create users table if not exists
            await client.execute(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    firstName TEXT NOT NULL,
                    lastName TEXT NOT NULL,
                    password TEXT NOT NULL,
                    isAdmin INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Check if user already exists
            const existingUser = await client.execute({
                sql: 'SELECT username FROM users WHERE username = ?',
                args: [username]
            });
            
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            
            // Create new user
            const isAdmin = username === 'admin' ? 1 : 0;
            await client.execute({
                sql: 'INSERT INTO users (username, firstName, lastName, password, isAdmin) VALUES (?, ?, ?, ?, ?)',
                args: [username, firstName, lastName, password, isAdmin]
            });
            
            res.json({ success: true, message: 'User registered successfully' });
            
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed: ' + error.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
