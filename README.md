# 📘 FriendBook

<div align="center">

**A Dual-Interface Social Networking Application**

*CLI & Web Interface | Shared Online Database | Advanced Friend Suggestions*

[![Made with C](https://img.shields.io/badge/C-00599C?style=flat&logo=c&logoColor=white)](https://en.wikipedia.org/wiki/C_(programming_language))
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Data Structures Used](#data-structures-used)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Team](#team)

---

## 🎯 Overview

FriendBook is a comprehensive social networking platform that demonstrates the practical implementation of advanced data structures in C. The application offers both a **Command-Line Interface (CLI)** and a modern **Web Interface**, both sharing a unified online database powered by Turso (LibSQL).

### Key Highlights

- **Dual Interface**: Seamlessly switch between CLI and web interfaces
- **Graph-Based Friend Network**: Efficient friendship management using adjacency lists
- **Smart Friend Suggestions**: BFS-based mutual friends algorithm
- **Real-time Operations**: Instant friend requests and notifications
- **Admin Dashboard**: Comprehensive user management system
- **Production Ready**: Deployed on cloud with Turso database

---

## ✨ Features

### Core Functionality
- ✅ User Registration & Authentication (JWT-based)
- ✅ Friend Request System (Send, Accept, Reject)
- ✅ Friend Management (Add, Remove, View)
- ✅ Smart Friend Suggestions (Mutual friends algorithm)
- ✅ Admin Dashboard (User management, Analytics)
- ✅ Real-time Web Interface
- ✅ Persistent Cloud Database (Turso/LibSQL)

### Advanced Features
- 🔐 Secure password hashing (bcrypt)
- 📊 Friend analytics and statistics
- 🔍 User search functionality
- 📱 Responsive web design
- ⚡ Optimized graph traversal algorithms
- 🌐 Online/Offline database fallback

---

## 🛠️ Tech Stack

### CLI Application (C)
```
├── Language: C (GCC compiler)
├── Database: SQLite3
├── Data Structures: Graphs, Hash Tables, Queues
└── Build System: Make
```

### Web Application (Node.js)
```
├── Backend: Express.js
├── Database: Turso (LibSQL) / SQLite3
├── Authentication: JWT (jsonwebtoken)
├── Security: Helmet, bcrypt, rate-limiting
├── Frontend: Vanilla JavaScript, HTML5, CSS3
└── Real-time: Socket.io ready
```

---

## 🚀 Quick Start

### Prerequisites
```bash
# CLI Requirements
gcc --version        # GCC compiler
make --version       # GNU Make
sqlite3 --version    # SQLite3

# Web Requirements
node --version       # Node.js v16+
npm --version        # npm package manager
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/FriendBook.git
   cd FriendBook
   ```

2. **Build & Run CLI**
   ```bash
   make cli
   ./build/friendbook
   ```

3. **Setup & Run Web Server**
   ```bash
   make web
   ./share.sh
   # Or manually: cd web && npm start
   ```

4. **Access Web Interface**
   ```
   http://localhost:3000
   ```

### Default Admin Credentials
```
Username: admin
Password: admin123
```

---

## 🏗️ Architecture

### Project Structure
```
FriendBook/
├── src/                    # CLI Source Code
│   ├── main.c             # Entry point & menu system
│   ├── user.c             # User management
│   ├── auth.c             # Authentication logic
│   ├── graph.c            # Graph operations
│   ├── friend_request.c   # Friend request handling
│   ├── suggestions.c      # Friend suggestion algorithm
│   ├── hashtable.c        # Hash table implementation
│   └── fileio.c           # File I/O operations
│
├── include/               # Header Files
│   ├── user.h
│   ├── graph.h
│   ├── auth.h
│   └── ...
│
├── web/                   # Web Application
│   ├── server.js          # Express server
│   ├── db-config.js       # Database configuration
│   ├── public/            # Frontend files
│   │   ├── index.html
│   │   ├── app.js
│   │   └── style.css
│   └── scripts/           # Utility scripts
│
├── build/                 # Compiled binaries
├── Makefile              # Build configuration
├── .env.example          # Environment template
├── DEPLOYMENT.md         # Deployment guide
└── README.md             # This file
```

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     FriendBook System                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐              ┌──────────────┐         │
│  │  CLI Client  │              │  Web Client  │         │
│  │  (C/SQLite)  │              │ (Browser JS) │         │
│  └──────┬───────┘              └──────┬───────┘         │
│         │                              │                 │
│         │         ┌────────────────────┘                 │
│         │         │                                      │
│         ▼         ▼                                      │
│  ┌────────────────────────┐                             │
│  │   Database Layer       │                             │
│  │  ┌──────────────────┐  │                             │
│  │  │ Turso (Online)   │◄─┼─── Primary                 │
│  │  └──────────────────┘  │                             │
│  │  ┌──────────────────┐  │                             │
│  │  │ SQLite (Local)   │◄─┼─── Fallback                │
│  │  └──────────────────┘  │                             │
│  └────────────────────────┘                             │
│                                                           │
│  ┌────────────────────────────────────────────┐         │
│  │         Data Structure Layer                │         │
│  │  ┌────────────┐  ┌────────────┐            │         │
│  │  │   Graph    │  │ Hash Table │            │         │
│  │  │ (Friends)  │  │  (Users)   │            │         │
│  │  └────────────┘  └────────────┘            │         │
│  │  ┌────────────┐  ┌────────────┐            │         │
│  │  │   Queue    │  │ Adjacency  │            │         │
│  │  │ (BFS/DFS)  │  │    List    │            │         │
│  │  └────────────┘  └────────────┘            │         │
│  └────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data Structures Used

### 1. **Graph (Adjacency List)**
**File**: `src/graph.c`, `include/graph.h`

**Purpose**: Represent friend relationships

**Operations**:
- `addEdge()`: Add friendship (O(1))
- `removeEdge()`: Remove friendship (O(V))
- `displayGraph()`: Display all connections (O(V + E))

**Implementation**:
```c
typedef struct AdjListNode {
    int userId;
    struct AdjListNode* next;
} AdjListNode;

typedef struct Graph {
    int numVertices;
    AdjListNode** adjLists;
} Graph;
```

### 2. **Hash Table**
**File**: `src/hashtable.c`, `include/hashtable.h`

**Purpose**: Fast user lookup by username

**Operations**:
- `insert()`: Add user (O(1) average)
- `search()`: Find user (O(1) average)
- `delete()`: Remove user (O(1) average)

**Collision Handling**: Chaining with linked lists

### 3. **Queue**
**File**: `src/suggestions.c`

**Purpose**: BFS traversal for friend suggestions

**Operations**:
- `enqueue()`: Add to queue (O(1))
- `dequeue()`: Remove from queue (O(1))
- Used in BFS for finding mutual friends

### 4. **Linked Lists**
**Purpose**: Various uses throughout the application
- Adjacency list nodes in graph
- Hash table collision chains
- Friend request queues

---

## 🔧 Build Commands

```bash
# Build CLI only
make cli

# Setup web application
make web

# Build both
make all

# Run CLI
make run-cli

# Run web server
make run-web

# Clean build files
make clean
```

---

## 🌐 API Documentation

### Authentication Endpoints

#### POST `/api/register`
Register a new user
```json
Request:
{
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Registration successful"
}
```

#### POST `/api/login`
Login user
```json
Request:
{
  "username": "johndoe",
  "password": "password123"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "isAdmin": 0
  }
}
```

### User Endpoints

#### GET `/api/users`
Get all users (requires authentication)

#### GET `/api/friends/:userId`
Get user's friends

#### GET `/api/smart-suggestions/:userId`
Get friend suggestions based on mutual friends

### Friend Request Endpoints

#### POST `/api/friend-request`
Send friend request
```json
{
  "fromUserId": 1,
  "toUserId": 2
}
```

#### GET `/api/friend-requests/:userId`
Get pending friend requests

#### POST `/api/accept-request/:requestId`
Accept friend request

#### DELETE `/api/remove-friend`
Remove friend
```json
{
  "userId": 1,
  "friendId": 2
}
```

### Admin Endpoints

#### POST `/api/admin/users`
Create user (admin only)

#### DELETE `/api/admin/users/:id`
Delete user (admin only)

#### DELETE `/api/admin/clear`
Clear all data except admin (admin only)

---

## 🚀 Deployment

The application is production-ready and can be deployed to:

- **Render** (Recommended)
- **Railway**
- **Vercel** (Serverless)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Environment Variables
```env
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token
JWT_SECRET=your_jwt_secret
NODE_ENV=production
PORT=3000
```

---

## 🧪 Testing

### Manual Testing
```bash
# Test CLI
./build/friendbook

# Test Web API
curl http://localhost:3000/api/users
```

### Test Scenarios
1. User registration and login
2. Friend request flow
3. Friend suggestions algorithm
4. Admin operations
5. Database failover (Turso → SQLite)

---

## 📈 Algorithm Complexity

| Operation | Time Complexity | Space Complexity |
|-----------|----------------|------------------|
| Add Friend | O(1) | O(1) |
| Remove Friend | O(V) | O(1) |
| Find Friends | O(V + E) | O(V) |
| Friend Suggestions (BFS) | O(V + E) | O(V) |
| User Lookup (Hash) | O(1) avg | O(n) |
| Authentication | O(1) | O(1) |

Where:
- V = Number of vertices (users)
- E = Number of edges (friendships)
- n = Number of users in hash table

---

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Rate limiting (1000 requests per 15 minutes)
- ✅ Input validation with express-validator
- ✅ Helmet.js security headers
- ✅ CORS protection
- ✅ XSS prevention

---

## 📝 License

This project is part of an academic assignment for **TCS-302: Data Structures in C**.

---

## 👥 Team

**Team ADAPT (DS-III-T005)**  
*TCS-302: Data Structures in C*

| Name | Roll Number | Role |
|------|-------------|------|
| Anurag Bhowmick | 240211698 | **Project Lead** - Full Stack Development, Data Structures, CLI, Web, Database, Documentation, Deployment |
| Tanishk Gupta | 240111241 | Team Member |
| Prajjwal Singh | 240111017 | Team Member |
| Divyanshi Singh | 240221677 | Team Member |

**Primary Contributor**: Anurag Bhowmick (240211698) - Developed the complete application including all data structures, algorithms, CLI implementation, web application, API, database design, security features, and comprehensive documentation.

---

## 🙏 Acknowledgments

- Course Instructor: [Instructor Name]
- Institution: [Institution Name]
- Course: TCS-302 - Data Structures in C

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [Your Email]

---

<div align="center">

**Made with ❤️ by Team ADAPT**

⭐ Star this repo if you found it helpful!

</div>
