let currentUser = null;
let activeSection = 'dashboard';

// Session restoration and initialization
document.addEventListener('DOMContentLoaded', function() {
    // Restore user session
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
        try {
            currentUser = JSON.parse(savedUser);
            document.getElementById('auth-screen').classList.remove('active');
            document.getElementById('main-screen').classList.add('active');
            document.getElementById('user-name').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
            
            if (currentUser.isAdmin) {
                document.getElementById('users-menu').style.display = 'block';
            }
            
            loadDashboard();
        } catch (error) {
            console.error('Session restore error:', error);
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
        }
    }
    
    // Keyboard event listeners
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const regPassword = document.getElementById('reg-password');
    
    if (loginUsername) loginUsername.addEventListener('keypress', e => e.key === 'Enter' && login());
    if (loginPassword) loginPassword.addEventListener('keypress', e => e.key === 'Enter' && login());
    if (regPassword) regPassword.addEventListener('keypress', e => e.key === 'Enter' && register());
});

// API helper
function apiCall(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    if (loginForm) loginForm.classList.add('active');
    if (registerForm) registerForm.classList.remove('active');
    if (tabBtns[0]) tabBtns[0].classList.add('active');
    if (tabBtns[1]) tabBtns[1].classList.remove('active');
}

window.showRegister = function() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    if (registerForm) registerForm.classList.add('active');
    if (loginForm) loginForm.classList.remove('active');
    if (tabBtns[1]) tabBtns[1].classList.add('active');
    if (tabBtns[0]) tabBtns[0].classList.remove('active');
}

window.login = async function() {
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
                document.getElementById('users-menu').style.display = 'block';
            }
            
            loadDashboard();
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Network error: Unable to connect to server', 'error');
    }
}

window.register = async function() {
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
            usernameEl.value = '';
            firstNameEl.value = '';
            lastNameEl.value = '';
            passwordEl.value = '';
        } else {
            showToast(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Network error: Unable to connect to server', 'error');
    }
}

window.logout = function() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    
    document.getElementById('main-screen').classList.remove('active');
    document.getElementById('auth-screen').classList.add('active');
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    
    showLogin();
}

// Navigation
window.showSection = function(section) {
    console.log('showSection called with:', section);
    activeSection = section;
    
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    
    const sectionEl = document.getElementById(`${section}-section`);
    const menuBtn = document.querySelector(`[onclick="showSection('${section}')"]`);
    
    if (sectionEl) sectionEl.classList.add('active');
    if (menuBtn) menuBtn.classList.add('active');
    
    switch(section) {
        case 'dashboard': loadDashboard(); break;
        case 'friends': loadFriends(); break;
        case 'requests': loadRequests(); break;
        case 'suggestions': loadSuggestions(); break;
        case 'users': loadAllUsers(); break;
    }
}

// Load functions
window.loadDashboard = async function() {
    if (!currentUser) return;
    
    try {
        const [friends, requests, sentRequests, suggestions] = await Promise.all([
            apiCall(`/api/friends/${currentUser.id}`).then(r => r.json()),
            apiCall(`/api/friend-requests/${currentUser.id}`).then(r => r.json()),
            apiCall(`/api/sent-requests/${currentUser.id}`).then(r => r.json()),
            apiCall(`/api/users`).then(r => r.json())
        ]);
        
        const friendIds = new Set((friends || []).map(f => f.id));
        const sentRequestIds = new Set((sentRequests || []).map(r => r.receiver_id));
        const receivedRequestIds = new Set((requests || []).map(r => r.id));
        
        const availableSuggestions = (suggestions || []).filter(user => 
            user.id !== currentUser.id && 
            !user.isAdmin &&
            !friendIds.has(user.id) && 
            !sentRequestIds.has(user.id) &&
            !receivedRequestIds.has(user.id)
        );
        
        const statFriends = document.getElementById('stat-friends');
        const statRequests = document.getElementById('stat-requests');
        const statSuggestions = document.getElementById('stat-suggestions');
        const statSent = document.getElementById('stat-sent');
        const requestCount = document.getElementById('request-count');
        
        if (statFriends) statFriends.textContent = (friends || []).length;
        if (statRequests) statRequests.textContent = (requests || []).length;
        if (statSuggestions) statSuggestions.textContent = availableSuggestions.length;
        if (statSent) statSent.textContent = (sentRequests || []).length;
        if (requestCount) requestCount.textContent = (requests || []).length;
        
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

window.loadFriends = async function() {
    if (!currentUser) return;
    
    try {
        const response = await apiCall(`/api/friends/${currentUser.id}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const friends = await response.json();
        
        const friendsList = document.getElementById('friends-list');
        if (friendsList) {
            if (!friends || friends.length === 0) {
                friendsList.innerHTML = '<p class="no-data">No friends yet. Send some friend requests!</p>';
            } else {
                friendsList.innerHTML = friends.map(friend => `
                    <div class="user-card">
                        <h3>${friend.firstName} ${friend.lastName}</h3>
                        <p>@${friend.username}</p>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Friends load error:', error);
        const friendsList = document.getElementById('friends-list');
        if (friendsList) {
            friendsList.innerHTML = '<p class="error">Failed to load friends. Please try again.</p>';
        }
    }
}

window.loadRequests = async function() {
    if (!currentUser) return;
    
    try {
        const response = await apiCall(`/api/friend-requests/${currentUser.id}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const requests = await response.json();
        
        const requestsList = document.getElementById('requests-list');
        const requestCount = document.getElementById('request-count');
        
        if (requestsList) {
            if (!requests || requests.length === 0) {
                requestsList.innerHTML = '<p class="no-data">No pending requests</p>';
            } else {
                requestsList.innerHTML = requests.map(request => `
                    <div class="user-card">
                        <h3>${request.firstName} ${request.lastName}</h3>
                        <p>@${request.username}</p>
                        <button onclick="acceptRequest(${request.id})" class="accept-btn">Accept</button>
                    </div>
                `).join('');
            }
        }
        
        if (requestCount) requestCount.textContent = (requests || []).length;
    } catch (error) {
        console.error('Requests load error:', error);
        const requestsList = document.getElementById('requests-list');
        if (requestsList) {
            requestsList.innerHTML = '<p class="error">Failed to load requests. Please try again.</p>';
        }
    }
}

window.loadSuggestions = async function() {
    if (!currentUser) return;
    
    try {
        const [usersResponse, friendsResponse, sentRequestsResponse, receivedRequestsResponse] = await Promise.all([
            apiCall('/api/users'),
            apiCall(`/api/friends/${currentUser.id}`),
            apiCall(`/api/sent-requests/${currentUser.id}`),
            apiCall(`/api/friend-requests/${currentUser.id}`)
        ]);
        
        const users = await usersResponse.json();
        const friends = await friendsResponse.json();
        const sentRequests = await sentRequestsResponse.json().catch(() => []);
        const receivedRequests = await receivedRequestsResponse.json();
        
        const friendIds = new Set((friends || []).map(f => f.id));
        const sentRequestIds = new Set((sentRequests || []).map(r => r.receiver_id));
        const receivedRequestIds = new Set((receivedRequests || []).map(r => r.sender_id));
        
        const suggestions = (users || []).filter(user => 
            user.id !== currentUser.id && 
            !user.isAdmin &&
            !friendIds.has(user.id) &&
            !sentRequestIds.has(user.id) &&
            !receivedRequestIds.has(user.id)
        ).slice(0, 10);
        
        const suggestionsList = document.getElementById('suggestions-list');
        if (suggestionsList) {
            if (suggestions.length === 0) {
                suggestionsList.innerHTML = '<p class="no-data">No suggestions available</p>';
            } else {
                suggestionsList.innerHTML = suggestions.map(user => `
                    <div class="user-card">
                        <h3>${user.firstName} ${user.lastName}</h3>
                        <p>@${user.username}</p>
                        <button onclick="sendRequestToUser(${user.id})" class="send-btn">Send Request</button>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Suggestions load error:', error);
    }
}

window.loadAllUsers = async function() {
    if (!currentUser || !currentUser.isAdmin) return;
    
    try {
        const response = await apiCall('/api/users');
        const users = await response.json();
        
        const usersList = document.getElementById('all-users-list');
        if (usersList) {
            usersList.innerHTML = (users || []).map(user => `
                <div class="user-card">
                    <h3>${user.firstName} ${user.lastName}</h3>
                    <p>@${user.username}</p>
                    <p>${user.isAdmin ? 'Admin' : 'User'}</p>
                    <button onclick="deleteUser(${user.id})" class="delete-btn">Delete</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Users load error:', error);
    }
}

// Action functions
window.sendFriendRequest = async function() {
    const usernameEl = document.getElementById('request-username');
    if (!usernameEl) return;
    
    const username = usernameEl.value.trim();
    if (!username) {
        showToast('Please enter a username', 'error');
        return;
    }
    
    try {
        const usersResponse = await apiCall('/api/users');
        const users = await usersResponse.json();
        const targetUser = users.find(u => u.username === username);
        
        if (!targetUser) {
            showToast('User not found', 'error');
            return;
        }
        
        const response = await apiCall('/api/friend-request', {
            method: 'POST',
            body: JSON.stringify({ fromUserId: currentUser.id, toUserId: targetUser.id })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Friend request sent!', 'success');
            usernameEl.value = '';
            loadDashboard();
        } else {
            showToast(data.error || 'Failed to send request', 'error');
        }
    } catch (error) {
        console.error('Send request error:', error);
        showToast('Network error', 'error');
    }
}

window.sendRequestToUser = async function(userId) {
    try {
        const response = await apiCall('/api/friend-request', {
            method: 'POST',
            body: JSON.stringify({ fromUserId: currentUser.id, toUserId: userId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Friend request sent!', 'success');
            loadSuggestions();
            loadDashboard();
        } else {
            showToast(data.error || 'Failed to send request', 'error');
        }
    } catch (error) {
        console.error('Send request error:', error);
        showToast('Network error', 'error');
    }
}

window.acceptRequest = async function(requestId) {
    try {
        const response = await apiCall(`/api/accept-request/${requestId}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Friend request accepted!', 'success');
            loadRequests();
            loadDashboard();
            loadSuggestions();
        } else {
            showToast(data.error || 'Failed to accept request', 'error');
        }
    } catch (error) {
        console.error('Accept request error:', error);
        showToast('Network error', 'error');
    }
}

// Admin functions
window.deleteUser = async function(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await apiCall(`/api/admin/users/${userId}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (result.success) {
            showToast('User deleted successfully', 'success');
            loadAllUsers();
        } else {
            showToast('Error deleting user', 'error');
        }
    } catch (error) {
        console.error('Delete user error:', error);
        showToast('Error deleting user', 'error');
    }
}

window.showAddUserForm = function() {
    document.getElementById('add-user-form').style.display = 'block';
}

window.hideAddUserForm = function() {
    document.getElementById('add-user-form').style.display = 'none';
}

window.addUser = async function() {
    const form = document.getElementById('new-user-form');
    const formData = new FormData(form);
    const userData = {
        username: formData.get('username'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        password: formData.get('password'),
        isAdmin: formData.get('isAdmin') === 'on'
    };
    
    try {
        const response = await apiCall('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('User created successfully', 'success');
            form.reset();
            hideAddUserForm();
            loadAllUsers();
        } else {
            showToast(result.error || 'Error creating user', 'error');
        }
    } catch (error) {
        console.error('Add user error:', error);
        showToast('Error creating user', 'error');
    }
}

window.clearDatabase = async function() {
    if (!confirm('Are you sure you want to clear the database? This cannot be undone.')) return;
    
    try {
        const response = await apiCall('/api/admin/clear', { method: 'DELETE' });
        const result = await response.json();
        
        if (result.success) {
            showToast('Database cleared successfully', 'success');
            loadAllUsers();
        } else {
            showToast('Error clearing database', 'error');
        }
    } catch (error) {
        console.error('Clear database error:', error);
        showToast('Error clearing database', 'error');
    }
}

// Refresh functions
window.refreshFriends = function() { loadFriends(); }
window.refreshSuggestions = function() { loadSuggestions(); }
window.refreshAllUsers = function() { loadAllUsers(); }
