const { DatabaseWrapper } = require('../web/db-config');

const db = new DatabaseWrapper();

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'POST') {
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
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
