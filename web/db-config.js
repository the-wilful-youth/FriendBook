const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Online database configuration
const DB_CONFIG = {
    // Option 1: Use Turso (SQLite in the cloud) - Free tier available
    turso: {
        url: process.env.TURSO_DATABASE_URL || '',
        authToken: process.env.TURSO_AUTH_TOKEN || ''
    },
    
    // Option 2: Use local SQLite as fallback
    local: {
        path: path.join(__dirname, 'friendbook.db')
    }
};

function createDatabase() {
    // Check if online database URL is provided
    if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
        console.log('🌐 Using Turso online database');
        const { createClient } = require('@libsql/client');
        
        return createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });
    } else {
        console.log('💾 Using local SQLite database');
        const db = new sqlite3.Database(DB_CONFIG.local.path, (err) => {
            if (err) {
                console.error('Database connection error:', err);
            } else {
                console.log('Connected to local SQLite database');
                // Optimize local database
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

// Database wrapper to handle both local and online
class DatabaseWrapper {
    constructor() {
        this.db = createDatabase();
        this.isOnline = !!process.env.TURSO_DATABASE_URL;
    }
    
    async query(sql, params = []) {
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
    }
    
    async run(sql, params = []) {
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
    }
    
    async get(sql, params = []) {
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
    }
}

module.exports = { DatabaseWrapper, DB_CONFIG };
