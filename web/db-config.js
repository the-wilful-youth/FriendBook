const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Online database configuration
const DB_CONFIG = {
    turso: {
        url: process.env.TURSO_DATABASE_URL || '',
        authToken: process.env.TURSO_AUTH_TOKEN || ''
    },
    local: {
        path: path.join(__dirname, 'friendbook.db')
    }
};

function createDatabase() {
    if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
        console.log('🌐 Using Turso online database');
        const { createClient } = require('@libsql/client');
        
        return createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
            timeout: 30000, // 30 second timeout
            fetch: (url, options) => {
                return fetch(url, {
                    ...options,
                    timeout: 30000,
                    signal: AbortSignal.timeout(30000)
                });
            }
        });
    } else {
        console.log('💾 Using local SQLite database');
        const db = new sqlite3.Database(DB_CONFIG.local.path, (err) => {
            if (err) {
                console.error('Database connection error:', err);
            } else {
                console.log('Connected to local SQLite database');
                db.run("PRAGMA journal_mode = WAL");
                db.run("PRAGMA synchronous = NORMAL");
                db.run("PRAGMA cache_size = 10000");
                db.run("PRAGMA temp_store = MEMORY");
                db.run("PRAGMA mmap_size = 268435456");
            }
        });
        
        return db;
    }
}

class DatabaseWrapper {
    constructor() {
        this.db = createDatabase();
        this.isOnline = !!process.env.TURSO_DATABASE_URL;
        this.retryCount = 0;
        this.maxRetries = 3;
    }
    
    async executeWithRetry(operation) {
        for (let i = 0; i < this.maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                console.log(`Database operation failed (attempt ${i + 1}/${this.maxRetries}):`, error.message);
                
                if (i === this.maxRetries - 1) {
                    if (this.isOnline) {
                        console.log('🔄 Falling back to local database');
                        this.isOnline = false;
                        this.db = new sqlite3.Database(DB_CONFIG.local.path);
                        return await operation();
                    }
                    throw error;
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }
    
    async query(sql, params = []) {
        return this.executeWithRetry(async () => {
            if (this.isOnline) {
                const result = await this.db.execute({ sql, args: params });
                return result.rows;
            } else {
                return new Promise((resolve, reject) => {
                    this.db.all(sql, params, (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    });
                });
            }
        });
    }
    
    async run(sql, params = []) {
        return this.executeWithRetry(async () => {
            if (this.isOnline) {
                const result = await this.db.execute({ sql, args: params });
                return { id: result.lastInsertRowid, changes: result.rowsAffected };
            } else {
                return new Promise((resolve, reject) => {
                    this.db.run(sql, params, function(err) {
                        if (err) reject(err);
                        else resolve({ id: this.lastID, changes: this.changes });
                    });
                });
            }
        });
    }
    
    async get(sql, params = []) {
        return this.executeWithRetry(async () => {
            if (this.isOnline) {
                const result = await this.db.execute({ sql, args: params });
                return result.rows[0] || null;
            } else {
                return new Promise((resolve, reject) => {
                    this.db.get(sql, params, (err, row) => {
                        if (err) reject(err);
                        else resolve(row || null);
                    });
                });
            }
        });
    }
}

module.exports = { DatabaseWrapper, DB_CONFIG };
