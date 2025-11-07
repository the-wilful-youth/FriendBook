const { DatabaseWrapper } = require('../web/db-config');

const db = new DatabaseWrapper();

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'GET') {
        try {
            const users = await db.query('SELECT id, username, firstName, lastName, isAdmin, created_at FROM users');
            res.json(users);
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
