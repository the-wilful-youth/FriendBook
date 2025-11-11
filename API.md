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

All admin endpoints require `isAdmin: 1` in JWT token.

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

## 🧪 Example Usage

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'
```

**Get Users (with token):**
```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using JavaScript (Fetch)

```javascript
// Login
const response = await fetch('http://localhost:3000/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    password: 'password123'
  })
});
const data = await response.json();
const token = data.token;

// Get users
const users = await fetch('http://localhost:3000/api/users', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  password TEXT NOT NULL,
  isAdmin INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Friendships Table
```sql
CREATE TABLE friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user1_id INTEGER NOT NULL,
  user2_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_id, user2_id)
);
```

### Friend Requests Table
```sql
CREATE TABLE friend_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sender_id, receiver_id)
);
```

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

## 📝 Notes

- All timestamps are in UTC
- User IDs start from 1
- Friendships are bidirectional
- Admin users cannot receive friend requests
- Database uses Turso (online) with SQLite (local) fallback

---

For more information, see the [main README](README.md) or [DEPLOYMENT guide](DEPLOYMENT.md).
