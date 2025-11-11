# FriendBook - Technical Documentation

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Data Structures](#data-structures)
3. [Algorithm Analysis](#algorithm-analysis)
4. [Database Design](#database-design)
5. [Security Implementation](#security-implementation)
6. [Performance Optimization](#performance-optimization)

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
    ┌───────▼──────┐                ┌──────▼───────┐
    │ CLI Client   │                │ Web Client   │
    │   (C Lang)   │                │ (JavaScript) │
    └───────┬──────┘                └──────┬───────┘
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
            ┌───────────────┼───────────────┐
            │               │               │
    ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼───────┐
    │    Graph     │ │Hash Table │ │    Queue     │
    │  (Friends)   │ │  (Users)  │ │    (BFS)     │
    └───────┬──────┘ └─────┬─────┘ └──────┬───────┘
            │               │               │
            └───────────────┼───────────────┘
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
                                    Data Structure Layer
                                              ↓
                                         Database
                                              ↓
                                    Response Formatting
                                              ↓
                                         User Output
```

---

## 2. Data Structures

### 2.1 Graph (Adjacency List)

**Purpose**: Represent the social network of friendships

**Structure**:
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

**Operations**:
| Operation | Implementation | Time Complexity | Space Complexity |
|-----------|----------------|-----------------|------------------|
| Create Graph | Allocate vertex array | O(V) | O(V) |
| Add Edge | Insert at head of list | O(1) | O(1) |
| Remove Edge | Traverse and delete | O(V) | O(1) |
| Find Friends | Traverse adjacency list | O(E) | O(1) |
| Display Graph | Visit all vertices | O(V + E) | O(1) |

**Memory Layout**:
```
Graph
  ├── numVertices: 100
  └── adjLists[100]
        ├── [0] → User5 → User12 → NULL
        ├── [1] → User7 → User9 → User15 → NULL
        ├── [2] → NULL
        └── ...
```

**Advantages**:
- Efficient for sparse graphs (typical in social networks)
- Easy to add/remove edges
- Memory efficient when |E| << |V²|

**Use Cases**:
- Friend relationship storage
- Graph traversal for suggestions
- Friendship path finding

---

### 2.2 Hash Table

**Purpose**: Fast user lookup by username

**Structure**:
```c
#define TABLE_SIZE 100

typedef struct HashNode {
    char* username;
    int userId;
    struct HashNode* next;
} HashNode;

typedef struct HashTable {
    HashNode* buckets[TABLE_SIZE];
} HashTable;
```

**Hash Function**:
```c
unsigned int hash(const char* str) {
    unsigned int hash = 5381;
    int c;
    while ((c = *str++))
        hash = ((hash << 5) + hash) + c; // hash * 33 + c
    return hash % TABLE_SIZE;
}
```

**Operations**:
| Operation | Average Case | Worst Case |
|-----------|--------------|------------|
| Insert | O(1) | O(n) |
| Search | O(1) | O(n) |
| Delete | O(1) | O(n) |

**Collision Resolution**: Chaining with linked lists

**Load Factor**: α = n/m where n = elements, m = buckets
- Target: α < 0.75 for good performance

---

### 2.3 Queue (for BFS)

**Purpose**: Breadth-First Search for friend suggestions

**Structure**:
```c
typedef struct QueueNode {
    int userId;
    struct QueueNode* next;
} QueueNode;

typedef struct Queue {
    QueueNode* front;
    QueueNode* rear;
} Queue;
```

**Operations**:
| Operation | Time Complexity | Space Complexity |
|-----------|----------------|------------------|
| Enqueue | O(1) | O(1) |
| Dequeue | O(1) | O(1) |
| IsEmpty | O(1) | O(1) |

**BFS Algorithm for Friend Suggestions**:
```
1. Initialize queue with current user's friends
2. Mark all direct friends as visited
3. While queue not empty:
   a. Dequeue a user
   b. For each friend of dequeued user:
      - If not visited and not already friends:
        * Add to suggestions
        * Mark as visited
   c. Track mutual friend count
4. Sort suggestions by mutual friends
5. Return top N suggestions
```

---

## 3. Algorithm Analysis

### 3.1 Friend Suggestion Algorithm

**Approach**: Modified BFS with mutual friend counting

**Pseudocode**:
```
function getSuggestions(userId):
    visited = new Set()
    suggestions = new Map()  // userId -> mutual_count
    
    // Get user's friends
    friends = getFriends(userId)
    
    // Mark direct friends as visited
    for friend in friends:
        visited.add(friend)
    
    // Check friends of friends
    for friend in friends:
        friendsOfFriend = getFriends(friend)
        
        for potential in friendsOfFriend:
            if potential not in visited and potential != userId:
                if potential in suggestions:
                    suggestions[potential]++
                else:
                    suggestions[potential] = 1
                visited.add(potential)
    
    // Sort by mutual friend count
    sorted = sortByValue(suggestions, descending)
    
    return top(sorted, 10)
```

**Complexity Analysis**:
- Time: O(V + E) where V = users, E = friendships
- Space: O(V) for visited set and suggestions map
- Optimal for sparse graphs (typical social networks)

**Optimizations**:
- Early termination after finding N suggestions
- Caching suggestions for frequently queried users
- Parallel processing for large networks

---

### 3.2 Graph Traversal

**DFS (Depth-First Search)**:
```c
void DFS(Graph* graph, int vertex, bool visited[]) {
    visited[vertex] = true;
    printf("%d ", vertex);
    
    AdjListNode* current = graph->adjLists[vertex];
    while (current != NULL) {
        int connectedVertex = current->userId;
        if (!visited[connectedVertex]) {
            DFS(graph, connectedVertex, visited);
        }
        current = current->next;
    }
}
```

**BFS (Breadth-First Search)**:
```c
void BFS(Graph* graph, int startVertex) {
    bool visited[MAX_USERS] = {false};
    Queue* queue = createQueue();
    
    visited[startVertex] = true;
    enqueue(queue, startVertex);
    
    while (!isEmpty(queue)) {
        int currentVertex = dequeue(queue);
        printf("%d ", currentVertex);
        
        AdjListNode* temp = graph->adjLists[currentVertex];
        while (temp) {
            int adjVertex = temp->userId;
            if (!visited[adjVertex]) {
                visited[adjVertex] = true;
                enqueue(queue, adjVertex);
            }
            temp = temp->next;
        }
    }
}
```

---

## 4. Database Design

### 4.1 Schema

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

### 4.2 Query Optimization

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

## 5. Security Implementation

### 5.1 Authentication Flow

```
Registration:
  User Input → Validation → Hash Password (bcrypt) → Store in DB

Login:
  User Input → Fetch User → Compare Passwords → Generate JWT → Return Token

Protected Request:
  Request + Token → Verify JWT → Extract User → Process Request
```

### 5.2 Security Layers

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

---

## 6. Performance Optimization

### 6.1 Database Optimizations

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

### 6.2 Compiler Optimizations

**Makefile Flags**:
```makefile
CFLAGS = -O3 -march=native -flto -DNDEBUG
```

**Explanations**:
- `-O3`: Maximum optimization level
- `-march=native`: CPU-specific optimizations
- `-flto`: Link-Time Optimization
- `-DNDEBUG`: Remove debug assertions

**Performance Gain**: ~30-40% faster execution

### 6.3 Algorithm Optimizations

**1. Early Termination**:
```c
// Stop after finding N suggestions
if (suggestionsCount >= MAX_SUGGESTIONS) break;
```

**2. Lazy Loading**:
```javascript
// Load friends only when needed
const friends = await getFriends(userId);
```

**3. Caching** (Future):
```javascript
const cache = new Map();
if (cache.has(userId)) return cache.get(userId);
// ... compute result
cache.set(userId, result);
```

---

## 7. Testing Strategy

### Unit Tests
- Hash function distribution
- Graph operations
- Queue operations
- Authentication logic

### Integration Tests
- API endpoint testing
- Database operations
- End-to-end user flows

### Performance Tests
- Load testing with 1000+ users
- Concurrent request handling
- Database query performance

---

## 8. Future Enhancements

### Scalability
- Database sharding for large user base
- Caching layer (Redis)
- Message queue for async operations
- Load balancing

### Features
- WebSocket for real-time updates
- Advanced graph algorithms (Dijkstra for friend paths)
- Machine learning for better suggestions
- Graph visualization

---

**Document Version**: 1.0  
**Last Updated**: 2024-11-11  
**Team**: ADAPT (DS-III-T005)
