let currentUser = null;

// Initialize keyboard listeners when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    // Don't run main app logic on admin page
    if (window.location.pathname === '/admin') return;

    // Restore user session on page load
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('token'); 
    
    if (savedUser && savedToken) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('Session restored for:', currentUser.username);
            
            // Switch to main screen
            document.getElementById('auth-screen').classList.remove('active');
            document.getElementById('main-screen').classList.add('active');
            document.getElementById('user-name').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
            
            // Show admin menu if admin
            if (currentUser.isAdmin) {
                window.location.href = '/admin';
                return;
            }
            
            // Initialize socket connection
            initSocket();
            
            // Load correct section based on URL
            handleInitialRoute();
            
        } catch (error) {
            console.error('Session restore error:', error);
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            currentUser = null;
        }
    }
    
    // Add keyboard listeners
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
    
    // If body is FormData, remove Content-Type to let browser set it with boundary
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }
    
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
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    if (loginForm) loginForm.classList.add('active');
    if (registerForm) registerForm.classList.remove('active');
    if (tabBtns[0]) tabBtns[0].classList.add('active');
    if (tabBtns[1]) tabBtns[1].classList.remove('active');
}

window.showRegister = function() {
    console.log('showRegister called');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    if (registerForm) registerForm.classList.add('active');
    if (loginForm) loginForm.classList.remove('active');
    if (tabBtns[1]) tabBtns[1].classList.add('active');
    if (tabBtns[0]) tabBtns[0].classList.remove('active');
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
                window.location.href = '/admin';
                return;
            }
            
            // Initialize socket connection
            initSocket();
            
            // Load dashboard stats after login
            loadDashboard();
            
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
            // Clear form fields
            usernameEl.value = '';
            firstNameEl.value = '';
            lastNameEl.value = '';
            passwordEl.value = '';
            showLogin();
        } else {
            // Show specific validation errors
            if (data.details && data.details.length > 0) {
                const errorMessages = data.details.map(detail => {
                    const field = detail.path;
                    const fieldName = field === 'firstName' ? 'First Name' : 
                                    field === 'lastName' ? 'Last Name' : 
                                    field.charAt(0).toUpperCase() + field.slice(1);
                    return `${fieldName}: Invalid format`;
                }).join(', ');
                showToast(errorMessages, 'error');
            } else {
                showToast(data.error || 'Registration failed', 'error');
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Network error', 'error');
    }
}

window.logout = function() {
    console.log('logout called');
    
    // Disconnect socket
    if (socket) {
        console.log('Disconnecting socket...');
        socket.disconnect();
        socket = null;
    }
    
    currentUser = null;
    currentChatFriendId = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    
    document.getElementById('main-screen').classList.remove('active');
    document.getElementById('auth-screen').classList.add('active');
    
    showLogin();
}

// Routing Logic
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.section) {
        showSection(event.state.section, false);
    } else {
        handleInitialRoute();
    }
});

function handleInitialRoute() {
    const path = window.location.pathname;
    const section = path.substring(1) || 'dashboard'; // Remove leading slash
    
    // Map paths to sections
    const routeMap = {
        '': 'dashboard',
        'dashboard': 'dashboard',
        'friends': 'friends',
        'requests': 'requests',
        'suggestions': 'suggestions',
        'chat': 'chat-list',
        'admin': 'admin' // Should be handled by server, but just in case
    };
    
    const targetSection = routeMap[section] || 'dashboard';
    if (targetSection !== 'admin') {
        showSection(targetSection, false);
    }
}

window.showSection = function(section, pushState = true) {
    console.log('showSection called with:', section);
    
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    
    const sectionEl = document.getElementById(`${section}-section`);
    const menuBtn = document.querySelector(`[onclick="showSection('${section}')"]`);
    
    if (sectionEl) sectionEl.classList.add('active');
    if (menuBtn) menuBtn.classList.add('active');
    
    // Update URL
    if (pushState) {
        const urlMap = {
            'dashboard': '/',
            'friends': '/friends',
            'requests': '/requests',
            'suggestions': '/suggestions',
            'chat-list': '/chat'
        };
        const url = urlMap[section] || `/${section}`;
        history.pushState({ section }, '', url);
    }
    
    // Load data for specific sections
    if (section === 'dashboard') {
        loadDashboard();
    } else if (section === 'friends') {
        loadFriends();
    } else if (section === 'chat-list') {
        loadChatList();
        // Reset message badge
        const badge = document.getElementById('message-count');
        if (badge) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    } else if (section === 'requests') {
        loadRequests();
    } else if (section === 'suggestions') {
        loadSuggestions();
    }
}

// Load chat list (friends to chat with)
window.loadChatList = async function() {
    if (!currentUser) return;
    
    try {
        console.log('Loading chat list...');
        const response = await apiCall(`/api/friends/${currentUser.id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const friends = await response.json();
        console.log('Chat friends loaded:', friends.length);
        
        const chatList = document.getElementById('chat-list');
        if (chatList) {
            if (!friends || friends.length === 0) {
                chatList.innerHTML = '<p class="no-data" style="grid-column: 1/-1; text-align: center; color: var(--text-light);">Add friends to start chatting!</p>';
            } else {
                chatList.innerHTML = friends.map(friend => `
                    <div class="user-card">
                        <div class="user-avatar">${friend.firstName[0]}${friend.lastName[0]}</div>
                        <h3>${friend.firstName} ${friend.lastName}</h3>
                        <p>@${friend.username}</p>
                        <button onclick="openChat(${friend.id}, '${friend.firstName}', '${friend.lastName}')" class="send-btn" style="width: 100%; margin-top: 0.5rem;">
                            💬 Open Chat
                        </button>
                    </div>
                `).join('');
            }
        }
        
    } catch (error) {
        console.error('Load chat list error:', error);
        const chatList = document.getElementById('chat-list');
        if (chatList) {
            chatList.innerHTML = '<p class="error">Failed to load chats. Please try again.</p>';
        }
        showToast('Failed to load chats', 'error');
    }
}

window.refreshChatList = function() {
    loadChatList();
}

// Load dashboard stats
window.loadDashboard = async function() {
    if (!currentUser) return;
    
    try {
        const [friendsRes, requestsRes, usersRes] = await Promise.all([
            apiCall(`/api/friends/${currentUser.id}`),
            apiCall(`/api/friend-requests/${currentUser.id}`),
            apiCall('/api/users')
        ]);
        
        const friends = await friendsRes.json();
        const requests = await requestsRes.json();
        const users = await usersRes.json();
        
        // Update dashboard stats
        const statFriends = document.getElementById('stat-friends');
        const statRequests = document.getElementById('stat-requests');
        const statSuggestions = document.getElementById('stat-suggestions');
        const requestCount = document.getElementById('request-count');
        
        if (statFriends) statFriends.textContent = (friends || []).length;
        if (statRequests) statRequests.textContent = (requests || []).length;
        if (requestCount) requestCount.textContent = (requests || []).length;
        
        // Calculate suggestions (users who aren't friends or have pending requests)
        const friendIds = new Set((friends || []).map(f => f.id));
        const requestIds = new Set((requests || []).map(r => r.sender_id));
        
        const suggestions = (users || []).filter(user => 
            user.id !== currentUser.id && 
            !user.isAdmin &&
            !friendIds.has(user.id) &&
            !requestIds.has(user.id)
        );
        
        if (statSuggestions) statSuggestions.textContent = suggestions.length;
        
        console.log('Dashboard loaded:', {
            friends: (friends || []).length,
            requests: (requests || []).length,
            suggestions: suggestions.length
        });
        
    } catch (error) {
        console.error('Dashboard load error:', error);
        showToast('Failed to load dashboard stats', 'error');
    }
}



// Load friends list
window.loadFriends = async function() {
    if (!currentUser) return;
    
    try {
        console.log('Loading friends...');
        const response = await apiCall(`/api/friends/${currentUser.id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const friends = await response.json();
        console.log('Friends loaded:', friends.length);
        
        const friendsList = document.getElementById('friends-list');
        if (friendsList) {
            if (!friends || friends.length === 0) {
                friendsList.innerHTML = '<p class="no-data" style="grid-column: 1/-1; text-align: center; color: var(--text-light);">No friends yet. Send some friend requests!</p>';
            } else {
                friendsList.innerHTML = friends.map(friend => `
                    <div class="user-card">
                        <div class="user-avatar">${friend.firstName[0]}${friend.lastName[0]}</div>
                        <h3>${friend.firstName} ${friend.lastName}</h3>
                        <p>@${friend.username}</p>
                        <button onclick="openChat(${friend.id}, '${friend.firstName}', '${friend.lastName}')" class="send-btn" style="margin-bottom: 0.5rem;">Chat</button>
                        <button onclick="removeFriend(${friend.id})" class="logout-btn" style="width:100%">Remove Friend</button>
                    </div>
                `).join('');
            }
        }
        
    } catch (error) {
        console.error('Load friends error:', error);
        const friendsList = document.getElementById('friends-list');
        if (friendsList) {
            friendsList.innerHTML = '<p class="error">Failed to load friends. Please try again.</p>';
        }
        showToast('Failed to load friends', 'error');
    }
}

// Load friend requests
window.loadRequests = async function() {
    if (!currentUser) return;
    
    try {
        console.log('Loading friend requests...');
        const response = await apiCall(`/api/friend-requests/${currentUser.id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const requests = await response.json();
        console.log('Friend requests loaded:', requests.length);
        
        const requestsList = document.getElementById('requests-list');
        const requestCount = document.getElementById('request-count');
        
        if (requestsList) {
            if (!requests || requests.length === 0) {
                requestsList.innerHTML = '<p class="no-data" style="grid-column: 1/-1; text-align: center; color: var(--text-light);">No pending requests</p>';
            } else {
                requestsList.innerHTML = requests.map(request => `
                    <div class="user-card">
                        <div class="user-avatar">${request.firstName[0]}${request.lastName[0]}</div>
                        <h3>${request.firstName} ${request.lastName}</h3>
                        <p>@${request.username}</p>
                        <button onclick="acceptRequest(${request.id})" class="send-btn">Accept Request</button>
                    </div>
                `).join('');
            }
        }
        
        if (requestCount) requestCount.textContent = (requests || []).length;
        
    } catch (error) {
        console.error('Load requests error:', error);
        const requestsList = document.getElementById('requests-list');
        if (requestsList) {
            requestsList.innerHTML = '<p class="error">Failed to load requests. Please try again.</p>';
        }
        showToast('Failed to load requests', 'error');
    }
}

// Load friend suggestions with advanced algorithm
window.loadSuggestions = async function() {
    if (!currentUser) return;
    
    try {
        console.log('Loading smart suggestions...');
        const response = await apiCall(`/api/smart-suggestions/${currentUser.id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const suggestions = await response.json();
        console.log('Smart suggestions loaded:', suggestions.length);
        
        const suggestionsList = document.getElementById('suggestions-list');
        if (suggestionsList) {
            if (!suggestions || suggestions.length === 0) {
                suggestionsList.innerHTML = '<p class="no-data" style="grid-column: 1/-1; text-align: center; color: var(--text-light);">No suggestions available</p>';
            } else {
                suggestionsList.innerHTML = suggestions.map(user => {
                    const mutualText = user.mutual_friends > 0 
                        ? `<div class="mutual-friends">👥 ${user.mutual_friends} mutual friend${user.mutual_friends > 1 ? 's' : ''}</div>`
                        : '';
                    
                    return `
                        <div class="user-card ${user.mutual_friends > 0 ? 'has-mutual' : ''}">
                            <div class="user-avatar">${user.firstName[0]}${user.lastName[0]}</div>
                            <h3>${user.firstName} ${user.lastName}</h3>
                            <p>@${user.username}</p>
                            ${mutualText}
                            <button onclick="sendRequestToUser(${user.id})" class="send-btn">
                                ${user.mutual_friends > 0 ? 'Add Friend' : 'Send Request'}
                            </button>
                        </div>
                    `;
                }).join('');
            }
        }
        
    } catch (error) {
        console.error('Load suggestions error:', error);
        const suggestionsList = document.getElementById('suggestions-list');
        if (suggestionsList) {
            suggestionsList.innerHTML = '<p class="error">Failed to load suggestions. Please try again.</p>';
        }
        showToast('Failed to load suggestions', 'error');
    }
}

window.acceptRequest = async function(requestId) {
    try {
        console.log('Accepting request:', requestId);
        const response = await apiCall(`/api/accept-request/${requestId}`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Friend request accepted!', 'success');
            loadRequests(); // Reload requests
            loadDashboard(); // Update dashboard stats
        } else {
            showToast(data.error || 'Failed to accept request', 'error');
        }
    } catch (error) {
        console.error('Accept request error:', error);
        showToast('Failed to accept request', 'error');
    }
}

window.sendRequestToUser = async function(userId) {
    try {
        console.log('Sending request to user:', userId);
        const response = await apiCall('/api/friend-request', {
            method: 'POST',
            body: JSON.stringify({ fromUserId: currentUser.id, toUserId: userId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Friend request sent!', 'success');
            loadSuggestions(); // Reload suggestions
            loadDashboard(); // Update dashboard stats
        } else {
            showToast(data.error || 'Failed to send request', 'error');
        }
    } catch (error) {
        console.error('Send request error:', error);
        showToast('Failed to send request', 'error');
    }
}

window.removeFriend = async function(friendId) {
    if (!confirm('Are you sure you want to remove this friend?')) {
        return;
    }
    
    try {
        console.log('Removing friend:', friendId);
        const response = await apiCall('/api/remove-friend', {
            method: 'DELETE',
            body: JSON.stringify({ userId: currentUser.id, friendId: friendId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Friend removed successfully', 'success');
            loadFriends(); // Reload friends list
            loadDashboard(); // Update dashboard stats
            loadSuggestions(); // Update suggestions (removed friend might appear)
        } else {
            showToast(data.error || 'Failed to remove friend', 'error');
        }
    } catch (error) {
        console.error('Remove friend error:', error);
        showToast('Failed to remove friend', 'error');
    }
}

window.deleteUser = async function(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await apiCall(`/api/admin/users/${userId}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (response.ok && result.success) {
            showToast('User deleted successfully', 'success');
            loadAllUsers(); // Reload the list
        } else {
            showToast(result.error || 'Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Delete user error:', error);
        showToast('Failed to delete user', 'error');
    }
}

// Simple placeholder functions for other buttons
window.sendFriendRequest = async function() {
    console.log('sendFriendRequest called');
    const usernameEl = document.getElementById('request-username');
    if (!usernameEl) {
        console.log('request-username element not found');
        return;
    }
    
    const username = usernameEl.value.trim();
    console.log('Username to send request to:', username);
    if (!username) {
        showToast('Please enter a username', 'error');
        return;
    }
    
    try {
        console.log('Fetching users...');
        const usersResponse = await apiCall('/api/users');
        const users = await usersResponse.json();
        console.log('Users fetched:', users.length);
        const targetUser = users.find(u => u.username === username);
        
        if (!targetUser) {
            console.log('User not found:', username);
            showToast('User not found', 'error');
            return;
        }
        
        // Prevent sending friend requests to admin users
        if (targetUser.isAdmin) {
            console.log('Cannot send friend request to admin user');
            showToast('Cannot send friend requests to admin users', 'error');
            return;
        }
        
        console.log('Sending friend request to user:', targetUser);
        const response = await apiCall('/api/friend-request', {
            method: 'POST',
            body: JSON.stringify({ fromUserId: currentUser.id, toUserId: targetUser.id })
        });
        
        const data = await response.json();
        console.log('Friend request response:', data);
        
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

window.refreshFriends = function() {
    console.log('refreshFriends called');
    loadFriends();
}

window.refreshSuggestions = function() {
    console.log('refreshSuggestions called');
    loadSuggestions();
}

window.refreshAllUsers = function() {
    console.log('refreshAllUsers called');
    loadAllUsers();
}

window.showAddUserForm = function() {
    console.log('showAddUserForm called');
    const modal = document.getElementById('add-user-form');
    if (modal) modal.style.display = 'block';
}

window.hideAddUserForm = function() {
    console.log('hideAddUserForm called');
    const modal = document.getElementById('add-user-form');
    if (modal) modal.style.display = 'none';
}

window.addUser = async function() {
    const form = document.getElementById('new-user-form');
    if (!form) return;
    
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
        
        if (response.ok && result.success) {
            showToast('User created successfully', 'success');
            form.reset();
            hideAddUserForm();
            loadAllUsers();
        } else {
            showToast(result.error || result.details?.[0]?.msg || 'Failed to create user', 'error');
        }
    } catch (error) {
        console.error('Add user error:', error);
        showToast('Network error', 'error');
    }
}

window.clearDatabase = function() {
    console.log('clearDatabase called');
    if (!confirm('Are you sure you want to clear the database? This will delete all users except admin and cannot be undone!')) {
        return;
    }
    
    apiCall('/api/admin/clear', { method: 'DELETE' })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showToast('Database cleared successfully', 'success');
                loadAllUsers(); // Refresh the user list
                loadDashboard(); // Refresh dashboard stats
            } else {
                showToast(result.error || 'Failed to clear database', 'error');
            }
        })
        .catch(error => {
            console.error('Clear database error:', error);
            showToast('Failed to clear database', 'error');
        });
}

window.showChangePasswordModal = function() {
    const modal = document.getElementById('change-password-modal');
    if (modal) modal.style.display = 'block';
}

window.hideChangePasswordModal = function() {
    const modal = document.getElementById('change-password-modal');
    if (modal) modal.style.display = 'none';
    document.getElementById('change-password-form').reset();
}

window.changePassword = async function() {
    console.log('Starting password change...');
    const currentPassword = document.getElementById('cp-current').value.trim();
    const newPassword = document.getElementById('cp-new').value.trim();
    const confirmPassword = document.getElementById('cp-confirm').value.trim();
    
    if (!currentPassword) {
        showToast('Please enter your current password', 'error');
        return;
    }
    
    if (!newPassword) {
        showToast('Please enter a new password', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    if (currentPassword === newPassword) {
        showToast('New password must be different from current password', 'error');
        return;
    }
    
    try {
        console.log('Sending request to /api/change-password');
        const response = await apiCall('/api/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response result:', result);
        
        if (response.ok && result.success) {
            showToast('Password updated successfully', 'success');
            document.getElementById('change-password-form').reset();
            hideChangePasswordModal();
        } else {
            showToast(result.error || 'Failed to update password', 'error');
        }
    } catch (error) {
        console.error('Change password error:', error);
        showToast('Network error: ' + error.message, 'error');
    }
}

// Socket.io Client
let socket = null;
let currentChatFriendId = null;

function initSocket() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No token found, cannot initialize socket');
        return;
    }

    // If socket exists and is connected, do nothing
    if (socket && socket.connected) {
        console.log('Socket already connected');
        return;
    }

    // Close existing disconnected socket if any
    if (socket) {
        socket.close();
    }

    console.log('Initializing socket connection...');
    socket = io({
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    socket.on('connect', () => {
        console.log('✅ Connected to socket server');
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        showToast(`Connection error: ${error.message}`, 'error');
    });
    
    socket.on('error', (err) => {
        console.error('Socket error:', err);
        // Handle object errors from server
        const msg = err.message || (typeof err === 'string' ? err : 'Unknown error');
        showToast(`Server error: ${msg}`, 'error');
    });
}

// Chat Functions
window.openChat = async function(friendId, firstName, lastName) {
    // Ensure socket is connected
    if (!socket) {
        console.log('Socket not initialized, attempting to connect...');
        initSocket();
        if (!socket) {
            showToast('Could not connect to chat server. Please refresh.', 'error');
            return;
        }
    }

    currentChatFriendId = friendId;
    const modal = document.getElementById('chat-modal');
    const title = document.getElementById('chat-username');
    const avatar = document.getElementById('chat-avatar');
    const messagesDiv = document.getElementById('chat-messages');
    
    title.textContent = `${firstName} ${lastName}`;
    avatar.textContent = `${firstName[0]}${lastName[0]}`;
    messagesDiv.innerHTML = '<p class="loading-text">Loading history...</p>';
    
    modal.style.display = 'block';
    
    // Load history
    try {
        const response = await apiCall(`/api/messages/${friendId}`);
        const messages = await response.json();
        
        messagesDiv.innerHTML = '';
        messages.forEach(msg => {
            const type = msg.sender_id === currentUser.id ? 'sent' : 'received';
            appendMessage(msg, type);
        });
        scrollToBottom();
        
    } catch (error) {
        console.error('Load history error:', error);
        messagesDiv.innerHTML = '<p class="error">Failed to load history</p>';
    }
}

window.closeChat = function() {
    document.getElementById('chat-modal').style.display = 'none';
    currentChatFriendId = null;
}

window.sendMessage = function() {
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    
    if (!socket || !socket.connected) {
        console.log('Socket disconnected, attempting to reconnect...');
        initSocket();
        
        // Wait a bit for connection
        setTimeout(() => {
            if (socket && socket.connected) {
                sendMessage(); // Retry sending
            } else {
                showToast('Connection timeout. Please try again.', 'error');
            }
        }, 2000); // Increased to 2s
        return;
    }
    
    if (!currentChatFriendId) {
        console.error('No friend selected');
        showToast('Error: No chat selected', 'error');
        return;
    }
    
    if (!content) {
        console.log('Empty message, ignoring');
        return;
    }
    
    console.log('✓ All checks passed');
    console.log('Sending message to:', currentChatFriendId, 'content:', content);
    
    const messageData = {
        toUserId: parseInt(currentChatFriendId),
        content: content,
        type: 'text'
    };
    
    // Optimistic UI: Append immediately
    const optimisticMsg = {
        ...messageData,
        sender_id: currentUser.id,
        receiver_id: parseInt(currentChatFriendId),
        created_at: new Date().toISOString()
    };
    appendMessage(optimisticMsg, 'sent');
    scrollToBottom();
    
    console.log('Message data:', JSON.stringify(messageData));
    
    // Send with Acknowledgement Callback
    socket.emit('private_message', messageData, (response) => {
        console.log('Server Ack:', response);
        if (response && response.status === 'ok') {
            console.log('Message delivered to server');
            // Optional: Update UI to show "Delivered" state if we had one
        } else {
            console.error('Message failed:', response ? response.message : 'Unknown error');
            showToast(`Failed to send: ${response ? response.message : 'Unknown error'}`, 'error');
            // Optional: Mark message as failed in UI
        }
    });
    console.log('✓ Message emitted to server');
    
    input.value = '';
}

window.toggleMediaMenu = function() {
    const menu = document.getElementById('media-menu');
    const btn = document.getElementById('media-menu-btn');
    menu.classList.toggle('active');
    
    // Close menu when clicking outside
    if (menu.classList.contains('active')) {
        document.addEventListener('click', closeMenuOutside);
    } else {
        document.removeEventListener('click', closeMenuOutside);
    }
}

function closeMenuOutside(e) {
    const menu = document.getElementById('media-menu');
    const btn = document.getElementById('media-menu-btn');
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove('active');
        document.removeEventListener('click', closeMenuOutside);
    }
}

window.triggerFileUpload = function(type) {
    const input = document.getElementById('chat-file-input');
    const menu = document.getElementById('media-menu');
    
    // Set accept attribute based on type
    if (type === 'image') input.accept = 'image/*';
    else if (type === 'video') input.accept = 'video/*';
    else input.removeAttribute('accept');
    
    input.click();
    menu.classList.remove('active');
}

window.handleFileUpload = async function(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Show uploading toast
    showToast('Uploading file...', 'info');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await apiCall('/api/chat/upload', {
            method: 'POST',
            body: formData,
            // Don't set Content-Type header, let browser set it with boundary
            headers: {} 
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Determine type
            let type = 'file';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('video/')) type = 'video';
            
            // Send message with attachment
            socket.emit('private_message', {
                toUserId: currentChatFriendId,
                content: '', // Optional caption could go here
                type: type,
                mediaUrl: data.url,
                fileName: data.filename
            });
            
            showToast('File sent!', 'success');
        } else {
            showToast(data.error || 'Upload failed', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Upload failed', 'error');
    }
    
    // Reset input
    input.value = '';
}

function appendMessage(msg, type) {
    const messagesDiv = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `message ${type}`;
    
    let contentHtml = '';
    
    if (msg.type === 'image') {
        contentHtml = `<img src="${msg.media_url}" class="message-image" alt="Image">`;
    } else if (msg.type === 'video') {
        contentHtml = `<video src="${msg.media_url}" class="message-video" controls></video>`;
    } else if (msg.type === 'file') {
        contentHtml = `
            <a href="${msg.media_url}" class="message-file" download="${msg.file_name}" target="_blank">
                <span class="icon">📄</span>
                <span>${msg.file_name}</span>
            </a>
        `;
    } else {
        contentHtml = msg.content;
    }
    
    if (type === 'sent') {
        contentHtml += '<span class="msg-status" style="font-size: 0.7rem; margin-left: 5px; opacity: 0.7;">✓</span>';
    }
    
    div.innerHTML = contentHtml;
    messagesDiv.appendChild(div);
}

function scrollToBottom() {
    const messagesDiv = document.getElementById('chat-messages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Add Enter key listener for chat
document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

console.log('FriendBook app.js loaded successfully');
