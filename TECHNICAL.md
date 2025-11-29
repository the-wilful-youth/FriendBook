# FriendBook - Technical Documentation

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Design](#database-design)
3. [Algorithm Analysis](#algorithm-analysis)
4. [Security Implementation](#security-implementation)
5. [Performance Optimization](#performance-optimization)

---

## 1. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FriendBook Platform                       │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            │          Web Client           │
            │         (Browser JS)          │
            │                               │
            └───────────────┬───────────────┘
                            │
                    ┌───────▼────────┐
                    │  API Layer     │
                    │  (Express.js)  │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │ Business Logic │
                    │   & Auth       │
                    └───────┬────────┘
                            │
                ┌───────────▼────────────┐
                │   Database Layer       │
                │  ┌─────────────────┐   │
                │  │ Turso (Primary) │   │
                │  └─────────────────┘   │
                │  ┌─────────────────┐   │
                │  │SQLite (Fallback)│   │
                │  └─────────────────┘   │
                └────────────────────────┘
```

### Component Interaction

```
User Input → Validation → Authentication → Business Logic
                                              ↓
                                         SQL Queries
                                              ↓
                                         Database
                                              ↓
                                    Response Formatting
                                              ↓
                                         User Output
```

---

## 2. Database Design

### 2.1 Schema

**Users Table**:
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    password TEXT NOT NULL,          -- bcrypt hashed
    isAdmin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_admin ON users(isAdmin);
```

**Friendships Table**:
```sql
CREATE TABLE friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id),
    FOREIGN KEY(user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(user2_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user1 ON friendships(user1_id);
CREATE INDEX idx_user2 ON friendships(user2_id);
```

**Friend Requests Table**:
```sql
CREATE TABLE friend_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sender_id, receiver_id),
    FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sender ON friend_requests(sender_id);
CREATE INDEX idx_receiver ON friend_requests(receiver_id);
CREATE INDEX idx_status ON friend_requests(status);
```

### 2.2 Query Optimization

**Frequently Used Queries**:

1. **Get User's Friends** (Optimized):
```sql
-- Uses index on user1_id and user2_id
SELECT u.id, u.username, u.firstName, u.lastName 
FROM users u 
JOIN friendships f ON (u.id = f.user1_id OR u.id = f.user2_id) 
WHERE (f.user1_id = ? OR f.user2_id = ?) AND u.id != ?;
```

2. **Get Pending Requests** (Optimized):
```sql
-- Uses index on receiver_id and status
SELECT fr.id, u.username, u.firstName, u.lastName 
FROM friend_requests fr 
JOIN users u ON fr.sender_id = u.id 
WHERE fr.receiver_id = ? AND fr.status = 'pending';
```

---

## 3. Algorithm Analysis

### 3.1 Smart Friend Suggestion Algorithm

**Approach**: Weighted scoring system based on mutual friends, network distance, and user activity.

**Scoring Factors**:
1. **Mutual Friends (50% weight)**:
   - Primary indicator of connection relevance.
   - Score += mutual_count * 5.0

2. **Network Distance (20% weight)**:
   - Bonus for "Friends of Friends" (Distance = 2).
   - Score += 3.0 if distance == 2

3. **Balanced Popularity (15% weight)**:
   - Penalizes users with vastly different friend counts to ensure balanced connections.
   - Uses ratio of friend counts.

4. **Active User Bonus (15% weight)**:
   - Encourages connecting with active users (2-20 friends).
   - Score += 2.0

**Implementation**:
The algorithm is implemented in JavaScript (Node.js) and executes the following steps:
1. Fetch user's direct friends.
2. Fetch pending/sent requests to exclude them.
3. Fetch all other users (candidates).
4. For each candidate:
   - Calculate mutual friends using SQL.
   - Calculate network distance.
   - Compute weighted score.
5. Sort candidates by score descending.
6. Return top 12 suggestions.

**Complexity Analysis**:
- Time: O(N * M) where N = total users, M = average friend count (due to mutual friend check).
- Space: O(N) to store candidate list.
- Optimization: Database indexing significantly speeds up the mutual friend queries.

---

## 4. Security Implementation

### 4.1 Authentication Flow

```
Registration:
  User Input → Validation → Hash Password (bcrypt) → Store in DB

Login:
  User Input → Fetch User → Compare Passwords → Generate JWT → Return Token

Protected Request:
  Request + Token → Verify JWT → Extract User → Process Request
```

### 4.2 Security Layers

**1. Input Validation**:
```javascript
body('username')
  .trim()
  .isLength({ min: 3, max: 50 })
  .matches(/^[a-zA-Z0-9_]+$/)
  .escape()
```

**2. Password Security**:
```javascript
// Hashing (10 rounds)
const hashedPassword = await bcrypt.hash(password, 10);

// Verification
const isValid = await bcrypt.compare(password, hashedPassword);
```

**3. JWT Configuration**:
```javascript
const token = jwt.sign(
  { id, username, isAdmin },
  JWT_SECRET,
  { expiresIn: '24h' }
);
```

**4. SQL Injection Prevention**:
```javascript
// Parameterized queries
await db.run('SELECT * FROM users WHERE id = ?', [userId]);
```

**5. Security Headers**:
- **Helmet.js**: Sets secure HTTP headers (CSP, X-XSS-Protection, etc).
- **Rate Limiting**: Prevents brute force attacks (1000 req / 15 min).

---

## 5. Performance Optimization

### 5.1 Database Optimizations

**SQLite Pragmas**:
```javascript
db.run("PRAGMA journal_mode = WAL");      // Write-Ahead Logging
db.run("PRAGMA synchronous = NORMAL");     // Balance safety/speed
db.run("PRAGMA cache_size = 10000");       // 10MB cache
db.run("PRAGMA temp_store = MEMORY");      // Memory temp tables
db.run("PRAGMA mmap_size = 268435456");    // 256MB memory map
```

**Benefits**:
- WAL: Concurrent reads, faster writes
- Cache: Reduced disk I/O
- Memory mapping: Faster data access

### 5.2 Application Optimizations

**1. Connection Pooling**:
- The database wrapper handles connection retries and state management.

**2. Efficient Data Loading**:
- Only necessary fields are selected in SQL queries (e.g., `SELECT id, username` instead of `SELECT *`).

**3. Static Asset Caching**:
- Express `express.static` handles caching for frontend assets.

---

**Document Version**: 2.0 (Web Adaptation)
**Last Updated**: 2025-11-29
**Team**: ADAPT (DS-III-T005)
