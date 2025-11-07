module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        console.log('Environment variables:');
        console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL ? 'Set' : 'Not set');
        console.log('TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN ? 'Set' : 'Not set');
        
        const { DatabaseWrapper } = require('../web/db-config');
        const db = new DatabaseWrapper();
        
        // Test database connection
        await db.run(`CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, name TEXT)`);
        await db.run(`INSERT OR REPLACE INTO test_table (id, name) VALUES (1, 'test')`);
        const result = await db.get(`SELECT * FROM test_table WHERE id = 1`);
        
        res.json({
            success: true,
            message: 'Database connection working',
            testResult: result,
            hasEnvVars: {
                database_url: !!process.env.TURSO_DATABASE_URL,
                auth_token: !!process.env.TURSO_AUTH_TOKEN
            }
        });
    } catch (error) {
        console.error('Test error:', error);
        res.status(500).json({
            error: 'Database test failed',
            message: error.message,
            hasEnvVars: {
                database_url: !!process.env.TURSO_DATABASE_URL,
                auth_token: !!process.env.TURSO_AUTH_TOKEN
            }
        });
    }
};
