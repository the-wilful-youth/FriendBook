# Contributing to FriendBook

Thank you for your interest in contributing to FriendBook! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## 🤝 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the project
- Show empathy towards other community members

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/FriendBook.git`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Make your changes
5. Test thoroughly
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

## 💻 Development Setup

### Prerequisites
```bash
# C Development
gcc >= 9.0
make >= 4.0
sqlite3 >= 3.0

# Node.js Development
node >= 16.0
npm >= 8.0
```

### Local Development
```bash
# Install dependencies
make all

# Run CLI in development
./build/friendbook

# Run web server
cd web && npm run dev
```

## 📝 Coding Standards

### C Code (CLI)
```c
// Use descriptive variable names
int userCount = 0;  // Good
int uc = 0;         // Bad

// Function naming: camelCase
void getUserById(int id);

// Constants: UPPER_CASE
#define MAX_USERS 1000

// Proper indentation (4 spaces)
if (condition) {
    // code
}

// Add comments for complex logic
// Calculate mutual friends using BFS
void findMutualFriends() {
    // implementation
}
```

### JavaScript Code (Web)
```javascript
// Use ES6+ features
const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);

// Async/await over callbacks
async function getUsers() {
    // Good
}

// Proper error handling
try {
    await operation();
} catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
}

// Descriptive function names
function validateUserInput() { }
```

### File Structure
```
- One feature per file
- Keep functions focused and small
- Maximum function length: 50 lines
- Use meaningful file names
```

## 📦 Commit Guidelines

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Build process or auxiliary tool changes

### Examples
```bash
feat(auth): add JWT token refresh mechanism

Implement automatic token refresh when token expires
within 5 minutes of expiration.

Closes #123

---

fix(graph): correct memory leak in adjacency list

Free allocated memory properly when removing edges
from the graph structure.

---

docs(readme): update installation instructions

Add detailed steps for Windows users and common
troubleshooting scenarios.
```

## 🔍 Pull Request Process

1. **Before Submitting**
   - Update documentation if needed
   - Add tests for new features
   - Ensure all tests pass
   - Update CHANGELOG.md
   - Follow coding standards

2. **PR Title Format**
   ```
   [Type] Brief description
   
   Examples:
   [Feature] Add user profile picture upload
   [Fix] Resolve friend request duplication bug
   [Docs] Improve API documentation
   ```

3. **PR Description Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Performance improvement
   
   ## Testing
   - [ ] Tested locally
   - [ ] Added unit tests
   - [ ] All tests passing
   
   ## Screenshots (if applicable)
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   ```

4. **Review Process**
   - At least one approval required
   - All CI checks must pass
   - No merge conflicts
   - Maintainer approval for major changes

## 🧪 Testing Guidelines

### CLI Testing
```bash
# Compile and run
make clean && make cli
./build/friendbook

# Test key features:
1. User registration
2. Login
3. Friend requests
4. Friend suggestions
5. Admin operations
```

### Web Testing
```bash
# Run development server
cd web && npm run dev

# Manual testing checklist:
- [ ] Registration flow
- [ ] Login/logout
- [ ] Friend operations
- [ ] Admin dashboard
- [ ] API endpoints
- [ ] Error handling
```

## 🐛 Bug Reports

### Required Information
- FriendBook version
- Operating system
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Error messages

### Template
```markdown
**Environment**
- OS: [e.g., macOS 12.0]
- Version: [e.g., 1.0.0]
- Interface: [CLI/Web]

**Describe the Bug**
Clear description

**To Reproduce**
1. Step 1
2. Step 2
3. ...

**Expected Behavior**
What should happen

**Screenshots**
If applicable

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

### Template
```markdown
**Feature Description**
Clear description of the feature

**Problem it Solves**
What problem does this address?

**Proposed Solution**
How would you implement this?

**Alternatives Considered**
Other solutions you've thought about

**Additional Context**
Mockups, examples, etc.
```

## 📚 Resources

- [C Style Guide](https://www.kernel.org/doc/html/v4.10/process/coding-style.html)
- [JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)

## 🙏 Recognition

**Primary Developer**: Anurag Bhowmick (240211698)
- Complete implementation of FriendBook
- All data structures and algorithms
- CLI and Web applications
- Database design and security
- Comprehensive documentation

Future contributors will be:
- Added to CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## 📞 Questions?

- Open a discussion on GitHub
- Contact team members
- Check existing issues and PRs

---

**Thank you for contributing to FriendBook! 🎉**
