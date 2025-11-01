# FriendBook

A dual-interface social networking application with CLI and web versions using a shared online database.

## Quick Start

```bash
make all
./build/friendbook    # CLI version
./share.sh           # Web version with online access
```

## Default Admin Account

- Username: `admin`
- Password: `admin123`

## Build Commands

```bash
make cli    # Build CLI application
make web    # Setup web application
make clean  # Clean build files
```

## Features

- User registration and authentication
- Friend request system
- Friendship management
- Friend suggestions
- Admin dashboard with user management
- Real-time web interface
- Shared online database (Turso)

## Architecture

```
FriendBook/
├── src/           # CLI source code
├── include/       # Header files
├── web/           # Web application
├── build/         # Compiled CLI binary
└── Makefile       # Build configuration
```

## Online Database Setup

1. Configure Turso credentials in `web/.env`:
   ```
   TURSO_DATABASE_URL=your_database_url
   TURSO_AUTH_TOKEN=your_auth_token
   ```

2. Both CLI and web will use the same online database

## Team

Team ADAPT (DS-III-T005) - TCS-302: Data Structures in C

- Anurag Bhowmick (240211698)
- Tanishk Gupta (240111241)
- Prajjwal Singh (240111017)
- Divyanshi Singh (240221677)
