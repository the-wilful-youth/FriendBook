// Admin Panel Logic

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    refreshAdminData();
});

function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!token || !user.isAdmin) {
        window.location.href = '/';
    }
}

async function refreshAdminData() {
    try {
        const response = await apiCall('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const users = await response.json();
        renderAdminTable(users);
        updateAdminStats(users);
    } catch (error) {
        console.error('Admin load error:', error);
        showToast('Failed to load admin data', 'error');
    }
}

function renderAdminTable(users) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div class="user-cell">
                    <div class="table-avatar" style="background: ${getRandomColor(user.firstName)}">
                        ${user.firstName[0]}${user.lastName[0]}
                    </div>
                    <div>
                        <div style="font-weight: 600">${user.firstName} ${user.lastName}</div>
                        <div style="font-size: 0.8rem; color: #888">ID: ${user.id}</div>
                    </div>
                </div>
            </td>
            <td>@${user.username}</td>
            <td>
                <span class="role-badge ${user.isAdmin ? 'role-admin' : 'role-user'}">
                    ${user.isAdmin ? 'Admin' : 'User'}
                </span>
            </td>
            <td>${new Date().toLocaleDateString()}</td>
            <td>
                ${!user.isAdmin ? `
                    <button onclick="deleteUser(${user.id})" class="action-btn btn-delete">
                        Delete
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function updateAdminStats(users) {
    document.getElementById('total-users').textContent = users.length;
    document.getElementById('total-admins').textContent = users.filter(u => u.isAdmin).length;
}

function getRandomColor(name) {
    const colors = ['#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff3e0', '#ffebee'];
    return colors[name.length % colors.length];
}

// Re-implementing add user for admin page specifically
async function adminAddUser() {
    const form = document.getElementById('new-user-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.isAdmin = form.querySelector('[name="isAdmin"]').checked;

    try {
        const response = await apiCall('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showToast('User created successfully', 'success');
            hideAddUserForm();
            form.reset();
            refreshAdminData();
        } else {
            showToast(result.error || 'Failed to create user', 'error');
        }
    } catch (error) {
        console.error('Create user error:', error);
        showToast('Network error', 'error');
    }
}

function confirmClearDatabase() {
    if (confirm('⚠️ DANGER ZONE ⚠️\n\nAre you sure you want to clear the ENTIRE database?\nThis will delete ALL users (except you), friends, and messages.\nThis action cannot be undone!')) {
        clearDatabase();
    }
}

async function clearDatabase() {
    try {
        const response = await apiCall('/api/admin/clear', {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            showToast('Database cleared successfully', 'success');
            refreshAdminData();
        } else {
            showToast(result.error || 'Failed to clear database', 'error');
        }
    } catch (error) {
        console.error('Clear DB error:', error);
        showToast('Network error', 'error');
    }
}

function adminLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    window.location.href = '/';
}
