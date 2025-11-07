module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'POST') {
        try {
            const { username, password } = req.body;
            console.log('Login attempt for:', username);
            
            // Check if we have Turso credentials
            if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
                console.log('No Turso credentials, using hardcoded admin');
                // Fallback to hardcoded admin for testing
                if (username === 'admin' && password === 'admin123') {
                    return res.json({
                        success: true,
                        user: {
                            id: 1,
                            username: 'admin',
                            firstName: 'Admin',
                            lastName: 'User',
                            isAdmin: 1
                        }
                    });
                } else {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }
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
            
            // Create admin user if not exists
            const adminCheck = await client.execute({
                sql: 'SELECT * FROM users WHERE username = ?',
                args: ['admin']
            });
            
            if (adminCheck.rows.length === 0) {
                await client.execute({
                    sql: 'INSERT INTO users (username, firstName, lastName, password, isAdmin) VALUES (?, ?, ?, ?, ?)',
                    args: ['admin', 'Admin', 'User', 'admin123', 1]
                });
                console.log('Admin user created');
            }
            
            // Check login credentials
            const userResult = await client.execute({
                sql: 'SELECT * FROM users WHERE username = ?',
                args: [username]
            });
            
            if (userResult.rows.length === 0 || userResult.rows[0].password !== password) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            const user = userResult.rows[0];
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
