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
            authToken: process.env.TURSO_AUTH_TOKEN
        });
    } else {
        console.log('💾 Using local SQLite database');
        const db = new sqlite3.Database(DB_CONFIG.local.path, (err) => {
            if (err) {
                console.error('Database connection error:', err);
            } else {
                console.log('Connected to local SQLite database');
            }
        });
        
        return db;
    }
}

class DatabaseWrapper {
    constructor() {
        this.db = createDatabase();
        this.isOnline = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
        console.log('Database mode:', this.isOnline ? 'Online (Turso)' : 'Local (SQLite)');
    }
    
    async query(sql, params = []) {
        try {
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
        } catch (error) {
            console.error('Query error:', error);
            throw error;
        }
    }
    
    async run(sql, params = []) {
        try {
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
        } catch (error) {
            console.error('Run error:', error);
            throw error;
        }
    }
    
    async get(sql, params = []) {
        try {
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
        } catch (error) {
            console.error('Get error:', error);
            throw error;
        }
    }
}

module.exports = { DatabaseWrapper, DB_CONFIG };
