let currentUser = null;

// Initialize keyboard listeners when DOM loads
document.addEventListener('DOMContentLoaded', function() {
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
                const usersMenu = document.getElementById('users-menu');
                if (usersMenu) usersMenu.style.display = 'block';
            }
            
            // Load dashboard
            loadDashboard();
            
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
                const usersMenu = document.getElementById('users-menu');
                if (usersMenu) usersMenu.style.display = 'block';
            }
            
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
    
    // Load data for specific sections
    if (section === 'dashboard') {
        loadDashboard();
    } else if (section === 'users') {
        loadAllUsers();
    } else if (section === 'friends') {
        loadFriends();
    } else if (section === 'requests') {
        loadRequests();
    } else if (section === 'suggestions') {
        loadSuggestions();
    }
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

// Load all users for admin
window.loadAllUsers = async function() {
    if (!currentUser || !currentUser.isAdmin) {
        console.log('Not admin, cannot load all users');
        return;
    }
    
    try {
        console.log('Loading all users...');
        const response = await apiCall('/api/users');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const users = await response.json();
        console.log('Users loaded:', users.length);
        
        const usersList = document.getElementById('all-users-list');
        if (usersList) {
            if (!users || users.length === 0) {
                usersList.innerHTML = '<p class="no-data">No users found</p>';
            } else {
                usersList.innerHTML = users.map(user => `
                    <div class="user-card">
                        <h3>${user.firstName} ${user.lastName}</h3>
                        <p>@${user.username}</p>
                        <p>${user.isAdmin ? 'Admin' : 'User'}</p>
                        ${user.username !== 'admin' ? `<button onclick="deleteUser(${user.id})" class="delete-btn">Delete</button>` : ''}
                    </div>
                `).join('');
            }
        }
        
    } catch (error) {
        console.error('Load all users error:', error);
        const usersList = document.getElementById('all-users-list');
        if (usersList) {
            usersList.innerHTML = '<p class="error">Failed to load users. Please try again.</p>';
        }
        showToast('Failed to load users', 'error');
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
                friendsList.innerHTML = '<p class="no-data">No friends yet. Send some friend requests!</p>';
            } else {
                friendsList.innerHTML = friends.map(friend => `
                    <div class="user-card">
                        <h3>${friend.firstName} ${friend.lastName}</h3>
                        <p>@${friend.username}</p>
                        <button onclick="removeFriend(${friend.id})" class="delete-btn">Remove Friend</button>
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
                suggestionsList.innerHTML = '<p class="no-data">No suggestions available</p>';
            } else {
                suggestionsList.innerHTML = suggestions.map(user => {
                    const mutualText = user.mutual_friends > 0 
                        ? `<p class="mutual-friends">${user.mutual_friends} mutual friend${user.mutual_friends > 1 ? 's' : ''}</p>`
                        : '<p class="new-user">New user</p>';
                    
                    return `
                        <div class="user-card ${user.mutual_friends > 0 ? 'has-mutual' : 'new-user-card'}">
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

console.log('FriendBook app.js loaded successfully');
