# 📚 FriendBook - Complete Documentation

## 📋 Table of Contents

1. [Technical Architecture](#technical-architecture)
2. [API Reference](#api-reference)
3. [Deployment Guide](#deployment-guide)

---

# Technical Architecture

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

# API Reference

Complete API documentation for FriendBook web server.

## Base URL
```
http://localhost:3000/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 📝 Endpoints

### Authentication

#### Register User
```http
POST /api/register
```

**Request Body:**
```json
{
  "username": "string (3-50 chars, alphanumeric + underscore)",
  "firstName": "string (1-50 chars, letters only)",
  "lastName": "string (1-50 chars, letters only)",
  "password": "string (6-100 chars)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Registration successful"
}
```

**Errors:**
- `400`: Username already exists
- `400`: Invalid input (validation errors)
- `500`: Registration failed

---

#### Login
```http
POST /api/login
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "isAdmin": 0
  }
}
```

**Errors:**
- `401`: Invalid credentials
- `500`: Server error

---

#### Change Password
```http
POST /api/change-password
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string (min 6 chars)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Errors:**
- `401`: Incorrect current password
- `500`: Failed to update password

---

### Users

#### Get All Users
```http
GET /api/users
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "isAdmin": 0
  },
  ...
]
```

---

#### Get User's Friends
```http
GET /api/friends/:userId
```

**Headers:**
```
Authorization: Bearer <token>
```

**Parameters:**
- `userId` (integer): User ID

**Response (200):**
```json
[
  {
    "id": 2,
    "username": "janedoe",
    "firstName": "Jane",
    "lastName": "Doe"
  },
  ...
]
```

---

#### Get Friend Suggestions
```http
GET /api/smart-suggestions/:userId
```

**Headers:**
```
Authorization: Bearer <token>
```

**Parameters:**
- `userId` (integer): User ID

**Response (200):**
```json
[
  {
    "id": 3,
    "username": "bobsmith",
    "firstName": "Bob",
    "lastName": "Smith",
    "mutual_friends": 5,
    "suggestion_score": 52.3
  },
  ...
]
```

**Algorithm:**
- Excludes current friends
- Excludes pending/sent requests
- Ranks by mutual friends count
- Returns top 10 suggestions
- Score = (mutual_friends × 10) + random(0-5)

---

### Friend Requests

#### Send Friend Request
```http
POST /api/friend-request
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "fromUserId": 1,
  "toUserId": 2
}
```

**Response (200):**
```json
{
  "message": "Friend request sent"
}
```

**Errors:**
- `400`: Cannot send request to admin users
- `500`: Failed to send request

---

#### Get Received Friend Requests
```http
GET /api/friend-requests/:userId
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 10,
    "username": "sender123",
    "firstName": "Sender",
    "lastName": "Name"
  },
  ...
]
```

---

#### Get Sent Friend Requests
```http
GET /api/sent-requests/:userId
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 11,
    "receiver_id": 5,
    "username": "receiver456",
    "firstName": "Receiver",
    "lastName": "Name"
  },
  ...
]
```

---

#### Accept Friend Request
```http
POST /api/accept-request/:requestId
```

**Headers:**
```
Authorization: Bearer <token>
```

**Parameters:**
- `requestId` (integer): Request ID

**Response (200):**
```json
{
  "message": "Friend request accepted"
}
```

**Errors:**
- `404`: Request not found
- `500`: Failed to accept request

---

#### Remove Friend
```http
DELETE /api/remove-friend
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": 1,
  "friendId": 2
}
```

**Response (200):**
```json
{
  "message": "Friend removed successfully"
}
```

---

### Admin Endpoints

The Admin Panel is accessible at `/admin`. It provides a dedicated interface for user management.

**API Endpoints** (Require `isAdmin: 1` in JWT token):

#### Create User (Admin)
```http
POST /api/admin/users
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "username": "string",
  "firstName": "string",
  "lastName": "string",
  "password": "string",
  "isAdmin": false
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User created successfully"
}
```

**Errors:**
- `400`: Username already exists
- `403`: Admin access required

---

#### Delete User (Admin)
```http
DELETE /api/admin/users/:id
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Parameters:**
- `id` (integer): User ID to delete

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Note:** Also deletes all user's friendships and friend requests

---

#### Clear Database (Admin)
```http
DELETE /api/admin/clear
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Database cleared successfully"
}
```

**Warning:** Deletes all users except admin, all friendships, and all friend requests

---

## 🔒 Security

### Rate Limiting
- **Limit**: 1000 requests per 15 minutes per IP
- **Response**: `429 Too Many Requests`

### Input Validation
All inputs are validated using `express-validator`:
- Username: 3-50 chars, alphanumeric + underscore
- Names: 1-50 chars, letters only
- Password: 6-100 chars
- IDs: Positive integers

### Password Security
- Hashed using bcrypt with 10 salt rounds
- Never returned in API responses
- Minimum 6 characters required

### JWT Tokens
- Expires in 24 hours
- Contains: `id`, `username`, `isAdmin`
- Secret key stored in environment variable

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

## 🔧 Environment Variables

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_auth_token
JWT_SECRET=your_jwt_secret
NODE_ENV=development|production
PORT=3000
FRONTEND_URL=http://localhost:3000
```

---

# Deployment Guide

## 🚀 Quick Deploy Options

### Option 1: Deploy to Render (Recommended)

1. **Push your code to GitHub** (if not already done)

   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Sign up at [Render.com](https://render.com)**

3. **Create a new Web Service:**

   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: friendbook
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free

4. **Add Environment Variables:**
   Go to "Environment" tab and add:

   ```
   TURSO_DATABASE_URL=<your_turso_database_url>
   TURSO_AUTH_TOKEN=<your_turso_auth_token>
   JWT_SECRET=<your_secure_jwt_secret>
   NODE_ENV=production
   ```

   **Note**: Use your actual Turso credentials from `.env` file

5. **Deploy!** Render will automatically build and deploy your app.

---

### Option 2: Deploy to Railway

1. **Push code to GitHub**

2. **Sign up at [Railway.app](https://railway.app)**

3. **Create New Project:**

   - Click "New Project" → "Deploy from GitHub repo"
   - Select your FriendBook repository
   - Railway will auto-detect it's a Node.js app

4. **Add Environment Variables:**
   In Railway dashboard → Variables tab:

   ```
   TURSO_DATABASE_URL=<your_turso_database_url>
   TURSO_AUTH_TOKEN=<your_turso_auth_token>
   JWT_SECRET=<your_secure_jwt_secret>
   NODE_ENV=production
   ```

   **Note**: Use your actual Turso credentials from `.env` file

5. **Deploy!** Railway automatically deploys on push.

---

### Option 3: Deploy to Vercel (Serverless)

1. **Install Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

2. **Deploy:**

   ```bash
   vercel
   ```

3. **Add Environment Variables** via Vercel dashboard

---

## 🔐 Security Checklist

Before deploying:

- [ ] Remove `.env` from repository (already in `.gitignore`)
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Update `FRONTEND_URL` in production environment
- [ ] Review and adjust rate limits in `server.js` if needed

---

## 🗄️ Database (Turso)

Your app uses Turso cloud database for production.

**To create your own Turso database:**

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create friendbook

# Get credentials
turso db show friendbook --url
turso db tokens create friendbook
```

**Then add these credentials to your `.env` file and deployment platform environment variables.**

---

## 📦 Local Testing Before Deploy

Test production build locally:

```bash
npm install
NODE_ENV=production npm start
```

Access at: http://localhost:3000

---

## 🌐 Post-Deployment

1. **Get your app URL** from hosting platform dashboard
2. **Update FRONTEND_URL** environment variable to your production URL

---

## 🔧 Common Issues

**Issue: Database connection fails**

- Check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are set correctly
- App will fallback to local SQLite if Turso fails

**Issue: Build fails**

- Ensure `npm install` runs successfully locally
- Check Node version (should be 16+)

**Issue: App crashes on startup**

- Check logs in hosting platform dashboard
- Verify all environment variables are set

---

## 📊 Monitoring

- **Render**: Check logs in dashboard → Logs tab
- **Railway**: Check logs in project → Deployments → View logs
- **Vercel**: Check Function logs in dashboard

---

## 💰 Pricing

All three platforms offer **free tiers** suitable for this project:

- **Render Free**: 750 hours/month, sleeps after inactivity
- **Railway Free**: $5 credit/month
- **Vercel Free**: Unlimited for hobby projects

For production with guaranteed uptime, upgrade to paid plans ($7-20/month).

---

## 🎯 Recommended: Render

For FriendBook, I recommend **Render** because:

- ✅ Simple setup with `render.yaml`
- ✅ Great free tier
- ✅ Persistent disk support
- ✅ Good for Node.js apps
- ✅ Easy environment variable management

---

Need help? Check the hosting platform documentation or raise an issue!
