let currentUser = null;

// Initialize keyboard listeners when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const regPassword = document.getElementById('reg-password');
    
    if (loginUsername) loginUsername.addEventListener('keypress', e => e.key === 'Enter' && login());
    if (loginPassword) loginPassword.addEventListener('keypress', e => e.key === 'Enter' && login());
    if (regPassword) regPassword.addEventListener('keypress', e => e.key === 'Enter' && register());
    
    console.log('Keyboard listeners added');
});

// API helper
function apiCall(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    
    return fetch(url, { ...options, headers });
}

// Toast notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => container.removeChild(toast), 300);
    }, 3000);
}

// Auth functions
window.showLogin = function() {
    console.log('showLogin called');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) loginForm.classList.add('active');
    if (registerForm) registerForm.classList.remove('active');
}

window.showRegister = function() {
    console.log('showRegister called');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (registerForm) registerForm.classList.add('active');
    if (loginForm) loginForm.classList.remove('active');
}

window.login = async function() {
    console.log('login called');
    const usernameEl = document.getElementById('login-username');
    const passwordEl = document.getElementById('login-password');
    
    if (!usernameEl || !passwordEl) {
        showToast('Form elements not found');
        return;
    }
    
    const username = usernameEl.value.trim();
    const password = passwordEl.value;
    
    if (!username || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            currentUser = data.user;
            
            document.getElementById('auth-screen').classList.remove('active');
            document.getElementById('main-screen').classList.add('active');
            document.getElementById('user-name').textContent = `${data.user.firstName} ${data.user.lastName}`;
            
            if (data.user.isAdmin) {
                const usersMenu = document.getElementById('users-menu');
                if (usersMenu) usersMenu.style.display = 'block';
            }
            
            showToast('Login successful!', 'success');
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Network error', 'error');
    }
}

window.register = async function() {
    console.log('register called');
    const usernameEl = document.getElementById('reg-username');
    const firstNameEl = document.getElementById('reg-firstname');
    const lastNameEl = document.getElementById('reg-lastname');
    const passwordEl = document.getElementById('reg-password');
    
    if (!usernameEl || !firstNameEl || !lastNameEl || !passwordEl) {
        showToast('Form elements not found');
        return;
    }
    
    const username = usernameEl.value.trim();
    const firstName = firstNameEl.value.trim();
    const lastName = lastNameEl.value.trim();
    const password = passwordEl.value;
    
    if (!username || !firstName || !lastName || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, firstName, lastName, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Registration successful! Please login.', 'success');
            showLogin();
        } else {
            showToast(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Network error', 'error');
    }
}

window.logout = function() {
    console.log('logout called');
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    
    document.getElementById('main-screen').classList.remove('active');
    document.getElementById('auth-screen').classList.add('active');
    
    showLogin();
}

window.showSection = function(section) {
    console.log('showSection called with:', section);
    
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    
    const sectionEl = document.getElementById(`${section}-section`);
    const menuBtn = document.querySelector(`[onclick="showSection('${section}')"]`);
    
    if (sectionEl) sectionEl.classList.add('active');
    if (menuBtn) menuBtn.classList.add('active');
    
    showToast(`Switched to ${section}`, 'info');
}

// Simple placeholder functions for other buttons
window.sendFriendRequest = function() {
    console.log('sendFriendRequest called');
    showToast('Friend request feature working!', 'success');
}

window.refreshFriends = function() {
    console.log('refreshFriends called');
    showToast('Refresh friends working!', 'info');
}

window.refreshSuggestions = function() {
    console.log('refreshSuggestions called');
    showToast('Refresh suggestions working!', 'info');
}

window.refreshAllUsers = function() {
    console.log('refreshAllUsers called');
    showToast('Refresh users working!', 'info');
}

window.showAddUserForm = function() {
    console.log('showAddUserForm called');
    showToast('Add user form working!', 'info');
}

window.hideAddUserForm = function() {
    console.log('hideAddUserForm called');
}

window.clearDatabase = function() {
    console.log('clearDatabase called');
    showToast('Clear database working!', 'info');
}

console.log('FriendBook app.js loaded successfully');
