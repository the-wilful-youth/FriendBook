# Changelog

All notable changes to FriendBook will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-11

### 🎉 Initial Release

#### Added

- **CLI Application (C)**
  - User registration and login system
  - Friend request management (send, accept, reject)
  - Friend list display and management
  - Smart friend suggestions using BFS algorithm
  - Admin dashboard with user management
  - Graph-based friend network using adjacency lists
  - Hash table for fast user lookup
  - Local SQLite database integration
- **Web Application (Node.js)**
  - RESTful API with Express.js
  - JWT-based authentication
  - User registration and login endpoints
  - Friend request system API
  - Smart friend suggestions endpoint
  - Admin panel API
  - Turso (LibSQL) online database support
  - Local SQLite fallback mechanism
  - Rate limiting and security middleware
  - Responsive web interface
- **Data Structures**
  - Graph implementation with adjacency lists
  - Hash table with chaining for collision resolution
  - Queue for BFS traversal
  - Linked lists for various operations
- **Security Features**
  - Password hashing with bcrypt (10 rounds)
  - JWT token authentication (24-hour expiry)
  - Input validation with express-validator
  - SQL injection prevention
  - Rate limiting (1000 requests/15 minutes)
  - Helmet.js security headers
  - CORS protection
- **Database**
  - Dual database support (Turso + SQLite)
  - Automatic failover mechanism
  - Database retry logic with exponential backoff
  - Optimized SQLite pragmas for local database
- **Documentation**
  - Comprehensive README with architecture diagrams
  - API documentation with examples
  - Deployment guide for multiple platforms
  - Contributing guidelines
  - Environment configuration examples
- **Build System**
  - Makefile for CLI compilation
  - npm scripts for web application
  - Optimized compiler flags (O3, LTO, native)
- **Deployment**
  - Render.com configuration (render.yaml)
  - Railway.app configuration (railway.json)
  - Production-ready environment setup
  - Environment variable templates

#### Features in Detail

**Friend Suggestions Algorithm:**

- BFS-based mutual friends calculation
- Excludes current friends and pending requests
- Ranking by mutual friend count
- Top 10 suggestions with randomness for variety

**Admin Capabilities:**

- View all users
- Create new users
- Delete users (cascading deletes)
- Clear entire database (except admin)
- User statistics and analytics

**Web Interface:**

- Clean, modern UI with responsive design
- Real-time friend request notifications
- User search functionality
- Friend suggestion cards
- Admin dashboard with user management

#### Technical Specifications

- **C Compiler**: GCC 9.0+
- **Node.js**: 16.0+
- **Database**: SQLite 3.0+, Turso/LibSQL
- **Build Tool**: GNU Make 4.0+

#### Known Limitations

- CLI and Web share database but not real-time state
- Maximum users limited by system memory
- Friend suggestions limited to 2 degrees of separation
- Rate limiting is per-IP, not per-user

---

## [Unreleased]

### Planned Features

- Real-time WebSocket notifications
- User profile pictures
- Friend activity feed
- Group chat functionality
- Advanced search filters
- Password reset functionality
- Email verification
- Two-factor authentication
- Friend request expiration
- Blocked users functionality

### Future Improvements

- Performance optimization for large friend networks
- Caching layer for frequently accessed data
- GraphQL API option
- Mobile app (React Native)
- Docker containerization
- Comprehensive test suite
- CI/CD pipeline
- Monitoring and logging system

---

## Version History

### [1.0.0] - 2024-11-11

- Initial release with core features

---

## Development Notes

### Breaking Changes

None (initial release)

### Migration Guide

Not applicable (initial release)

### Dependencies Updates

See `package.json` and `Makefile` for current dependency versions.

---

## Contributors

**Team Members**:

- Anurag Bhowmick (240211698)
- Tanishk Gupta (240111241)
- Prajjwal Singh (240111017)
- Divyanshi Singh (240221677)

---

## Links

- [GitHub Repository](https://github.com/yourusername/FriendBook)
- [Issue Tracker](https://github.com/yourusername/FriendBook/issues)
- [Documentation](README.md)
- [API Reference](API.md)
- [Deployment Guide](DEPLOYMENT.md)

---

[1.0.0]: https://github.com/yourusername/FriendBook/releases/tag/v1.0.0
[Unreleased]: https://github.com/yourusername/FriendBook/compare/v1.0.0...HEAD
