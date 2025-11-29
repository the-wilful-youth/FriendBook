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
# Node.js Development
node >= 16.0
npm >= 8.0
```

### Local Development

```bash
# Install dependencies
npm install

# Run web server in development mode
npm run dev
```

## 📝 Coding Standards

### JavaScript Code

```javascript
// Use ES6+ features
const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);

// Async/await over callbacks
async function getUsers() {
  // Good
}

// Proper error handling
try {
  await operation();
} catch (error) {
  console.error("Error:", error);
  res.status(500).json({ error: "Server error" });
}

// Descriptive function names
function validateUserInput() {}
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

3. **Review Process**
   - At least one approval required
   - All CI checks must pass
   - No merge conflicts
   - Maintainer approval for major changes

## 🧪 Testing Guidelines

### Web Testing

```bash
# Run development server
npm run dev

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

## 💡 Feature Requests

### Template

```markdown
**Feature Description**
Clear description of the feature

**Problem it Solves**
What problem does this address?

**Proposed Solution**
How would you implement this?
```

## 📚 Resources

- [JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)

---

**Thank you for contributing to FriendBook! 🎉**
