# FriendBook: Mini Social Media System

A C-based social networking application implementing core data structures for educational purposes.

## Team Information
- **Team Name:** Team ADAPT (DS-III-T005)
- **Course:** TCS-302: Data Structures in C
- **Team Members:**
  - Anurag Bhowmick (Team Lead) - 240211698
  - Tanishk Gupta - 240111241
  - Prajjwal Singh - 240111017
  - Divyanshi Singh - 240221677

## Features

### Core Functionality
- User registration and authentication
- Friend request system (send/accept/reject)
- Friendship management (add/remove)
- Intelligent friend suggestions based on mutual connections
- Data persistence through file storage
- Interactive command-line interface

### Data Structures Implemented
1. **Linked Lists** - User management and storage
2. **Graphs (Adjacency List)** - Friendship network representation
3. **Queues** - Friend request handling (FIFO)
4. **Hash Tables** - Fast user lookup by username
5. **Priority Queue** - Ranked friend suggestions

## System Architecture

```
FriendBook/
├── src/
│   ├── main.c           # Main application logic
│   ├── user.c           # User management functions
│   ├── graph.c          # Graph operations for friendships
│   ├── auth.c           # Authentication system
│   ├── fileio.c         # Data persistence
│   ├── friend_request.c # Friend request queue
│   ├── hashtable.c      # Hash table for fast lookup
│   └── suggestions.c    # Friend suggestion algorithm
├── include/             # Header files
├── obj/                # Compiled object files
├── build/              # Compiled executable
└── data/               # Data storage files
    ├── users.csv       # User data (CSV format)
    ├── friendships.csv # Friendship connections (CSV format)
    └── requests.csv    # Pending friend requests (CSV format)
```

## Algorithms

### Friend Suggestion Algorithm
1. **Graph Traversal**: Uses BFS-style traversal to find friends-of-friends
2. **Mutual Friend Counting**: Counts common connections between users
3. **Ranking System**: Sorts suggestions by number of mutual friends
4. **Duplicate Prevention**: Avoids suggesting existing friends or self

### Hash Table Implementation
- **Hash Function**: djb2 algorithm for string hashing
- **Collision Resolution**: Chaining with linked lists
- **Load Factor**: Optimized for up to 1000 users

## Building and Running

### Prerequisites
- GCC compiler
- Make utility

### Build Instructions
```bash
make clean
make
```

### Running the Application
```bash
./build/friendbook
```

## Usage Guide

### Menu Options
1. **Register** - Create new user account
2. **Login** - Authenticate existing user
3. **Display users** - Show all registered users
4. **Send friend request** - Send request by username
5. **View & accept requests** - Manage incoming requests
6. **Show my friends** - Display friend list
7. **Friend suggestions** - Get ranked friend recommendations
8. **Remove friendship** - Remove existing friendship
9. **Logout** - Return to welcome screen
0. **Exit** - Quit application

### Example Session
```
1. Register with username/password
2. Login with credentials
3. Send friend requests to other users
4. Accept incoming requests
5. View friend suggestions based on mutual connections
```

## Data Persistence

### File Formats
- **users.csv**: CSV format with headers `id,username,firstName,lastName,password`
- **friendships.csv**: CSV format with headers `user1,user2` (undirected edges)
- **requests.csv**: CSV format with headers `fromId,toId`

### Auto-Save Feature
- Data is automatically saved after every user action
- No manual save required - changes persist immediately
- Automatic loading on startup
- Hash table rebuilt for fast access
- Graph reconstruction from friendship data

## Technical Specifications

### Limitations
- Maximum 1000 users (configurable via MAX_USERS)
- Command-line interface only
- Local file storage (no database)
- Single-threaded execution

### Memory Management
- Dynamic allocation for all data structures
- Proper cleanup and deallocation
- Error handling for malloc failures

### Security Considerations
- Basic password storage (plaintext - for educational purposes)
- Input validation and buffer overflow protection
- Unique username enforcement

## Testing

The system has been tested with:
- Multiple user registrations
- Friend request workflows
- Friendship network building
- Suggestion algorithm accuracy
- Data persistence across sessions

## Future Enhancements

Potential improvements for production use:
- Password hashing and encryption
- Database integration
- Web-based interface
- Advanced recommendation algorithms
- User profiles and additional metadata
- Group functionality
- Message system

## References

- Yashavant Kanetkar – Let Us C
- GeeksforGeeks – Data Structures and Algorithms
- TutorialsPoint – C Programming and Graph Algorithms
- GNU GCC Documentation

## License

Educational project for TCS-302 course. All rights reserved to the team members.
