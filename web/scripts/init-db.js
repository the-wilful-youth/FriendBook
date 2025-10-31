const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const db = new sqlite3.Database('./friendbook.db');
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        password TEXT NOT NULL,
        isAdmin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS friendships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user1_id INTEGER NOT NULL,
        user2_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user1_id) REFERENCES users (id),
        FOREIGN KEY (user2_id) REFERENCES users (id),
        UNIQUE(user1_id, user2_id)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS friend_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_user_id INTEGER NOT NULL,
        to_user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_user_id) REFERENCES users (id),
        FOREIGN KEY (to_user_id) REFERENCES users (id),
        UNIQUE(from_user_id, to_user_id)
    )`);
    const csvPath = '../data/users.csv';
    if (fs.existsSync(csvPath)) {
        console.log('Importing existing CSV data...');
        const csvData = fs.readFileSync(csvPath, 'utf8');
        const lines = csvData.split('\n').slice(1); 
        const stmt = db.prepare("INSERT OR IGNORE INTO users (id, username, firstName, lastName, password, isAdmin) VALUES (?, ?, ?, ?, ?, ?)");
        lines.forEach(line => {
            if (line.trim()) {
                const parts = line.split(',');
                if (parts.length >= 5) {
                    const [id, username, firstName, lastName, password] = parts;
                    const isAdmin = parts[5] ? parseInt(parts[5]) : (parseInt(id) === 0 ? 1 : 0); 
                    if (id && username && firstName && lastName && password) {
                        const hashedPassword = bcrypt.hashSync(password, 10);
                        stmt.run(parseInt(id), username, firstName, lastName, hashedPassword, isAdmin);
                    }
                }
            }
        });
        stmt.finalize();
        console.log('CSV data imported successfully!');
    }
    const friendshipsPath = '../data/friendships.csv';
    if (fs.existsSync(friendshipsPath)) {
        const csvData = fs.readFileSync(friendshipsPath, 'utf8');
        const lines = csvData.split('\n').slice(1); 
        const stmt = db.prepare("INSERT OR IGNORE INTO friendships (user1_id, user2_id) VALUES (?, ?)");
        lines.forEach(line => {
            if (line.trim()) {
                const [user1, user2] = line.split(',');
                if (user1 && user2) {
                    stmt.run(parseInt(user1), parseInt(user2));
                }
            }
        });
        stmt.finalize();
        console.log('Friendships imported successfully!');
    }
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (!err && row.count === 0) {
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            db.run("INSERT INTO users (username, firstName, lastName, password, isAdmin) VALUES (?, ?, ?, ?, ?)", 
                   ['admin', 'System', 'Administrator', hashedPassword, 1], function(err) {
                if (!err) {
                    console.log('Default admin created: username="admin", password="admin123"');
                }
            });
        }
    });
});
db.close((err) => {
    if (err) {
        console.error('Error closing database:', err);
    } else {
        console.log('Database initialized successfully!');
        console.log('Run "npm start" to start the server.');
    }
});
