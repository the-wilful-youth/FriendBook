# 📘 FriendBook

<div align="center">

**A Modern Social Networking Web Application**

_Real-time Connections | Smart Friend Suggestions | Cloud-Ready_

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Quick Start](#-quick-start)
- [Architecture](#️-architecture)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Team](#-team)

---

## 🎯 Overview

FriendBook is a comprehensive social networking platform built with Node.js and Express. It features a modern, responsive web interface and a powerful backend that handles user relationships, friend requests, and smart suggestions using advanced graph algorithms.

### Key Highlights

- **Modern Web Interface**: Clean, responsive, and intuitive UI
- **Smart Friend Suggestions**: Advanced algorithm based on mutual friends and network analysis
- **Real-time Operations**: Instant friend requests and updates
- **Admin Dashboard**: Comprehensive user management system
- **Production Ready**: Deployed on cloud with Turso (LibSQL) support
- **Secure**: JWT authentication and bcrypt password hashing

---

## ✨ Features

### Core Functionality

- ✅ User Registration & Authentication (JWT-based)
- ✅ Friend Request System (Send, Accept, Reject)
- ✅ Friend Management (Add, Remove, View)
- ✅ Smart Friend Suggestions (Mutual friends algorithm)
- ✅ Admin Dashboard (User management, Analytics)
- ✅ Persistent Cloud Database (Turso/LibSQL) or Local SQLite

### Advanced Features

- 🔐 Secure password hashing (bcrypt)
- 📊 Friend analytics and statistics
- 🔍 User search functionality
- 📱 Responsive web design
- 🌐 Online/Offline database fallback

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Turso (LibSQL) / SQLite3
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, bcrypt, rate-limiting

### Frontend
- **Core**: Vanilla JavaScript, HTML5, CSS3
- **Design**: Custom responsive CSS

---

## 🚀 Quick Start

### Prerequisites

```bash
node --version       # Node.js v16+
npm --version        # npm package manager
```

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/FriendBook.git
   cd FriendBook
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Run the Application**

   ```bash
   npm start
   ```

4. **Access Web Interface**
   ```
   http://localhost:3000
   ```

### Remote Access (Optional)

To share your local instance with others:

```bash
./share.sh
```

---

## 🏗️ Architecture

### Project Structure

```
FriendBook/
├── server.js          # Express server entry point
├── db-config.js       # Database configuration
├── public/            # Frontend files
│   ├── index.html
│   ├── app.js
│   └── style.css
├── scripts/           # Utility scripts
├── railway.json       # Railway deployment config
├── render.yaml        # Render deployment config
└── README.md          # This file
```

---

## 🌐 API Documentation

### Authentication Endpoints

#### POST `/api/register`
Register a new user
```json
{ "username": "johndoe", "firstName": "John", "lastName": "Doe", "password": "password123" }
```

#### POST `/api/login`
Login user
```json
{ "username": "johndoe", "password": "password123" }
```

### User Endpoints

- **GET** `/api/users` - Get all users (requires authentication)
- **GET** `/api/friends/:userId` - Get user's friends
- **GET** `/api/smart-suggestions/:userId` - Get friend suggestions

### Friend Request Endpoints

- **POST** `/api/friend-request` - Send friend request
- **GET** `/api/friend-requests/:userId` - Get pending friend requests
- **POST** `/api/accept-request/:requestId` - Accept friend request
- **DELETE** `/api/remove-friend` - Remove friend

### Admin Endpoints

- **POST** `/api/admin/users` - Create user (admin only)
- **DELETE** `/api/admin/users/:id` - Delete user (admin only)
- **DELETE** `/api/admin/clear` - Clear all data (admin only)

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

## 📝 License

This project is part of an academic Project for **TCS-302: Data Structures in C** (Web Adaptation).

---

## 👥 Team

**Team ADAPT (DS-III-T005)**

| Name            | Roll Number | Email                        |
| --------------- | ----------- | ---------------------------- |
| Anurag Bhowmick | 240211698   | anuragbhowmick1711@gmail.com |
| Tanishk Gupta   | 240111241   | tanishkg232@gmail.com        |
| Prajjwal Singh  | 240111017   | prajjwalsingh8705@gmail.com  |
| Divyanshi Singh | 240221677   | dnshi235@gmail.com           |

<div align="center">

**Made with ❤️ by Team ADAPT**

⭐ Star this repo if you found it helpful!

</div>
