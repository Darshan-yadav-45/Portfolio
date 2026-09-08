const API_URL = '/api';

// --- Login Logic ---
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const res = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem('admin_token', data.token);
            window.location.href = '/admin/dashboard';
        } else {
            errorDiv.textContent = data.error || 'Login failed';
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

function logoutAdmin() {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin/login';
}

function getAuthHeaders() {
    const token = localStorage.getItem('admin_token');
    return { 'Authorization': `Bearer ${token}` };
}

// --- Dashboard Logic ---
let projects = [];

async function fetchAdminProjects() {
    try {
        const res = await fetch(`${API_URL}/admin/projects`, {
            headers: getAuthHeaders()
        });
        
        if (res.status === 401 || res.status === 403) {
            logoutAdmin();
            return;
        }
        
        projects = await res.json();
        renderProjectsTable();
    } catch (err) {
        console.error('Failed to fetch projects', err);
    }
}

function renderProjectsTable() {
    const tbody = document.getElementById('projects-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    projects.forEach(p => {
        const statusClass = p.published ? 'published' : 'draft';
        const statusText = p.published ? 'Published' : 'Unpublished';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    ${p.image_url ? `<img src="${p.image_url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">` : '<div style="width:50px; height:50px; background:rgba(255,255,255,0.1); border-radius:8px;"></div>'}
                    <div>
                        <strong>${p.title}</strong>
                        ${p.featured ? '<span style="color:var(--primary); font-size:0.8rem; margin-left:8px;">★ Featured</span>' : ''}
                    </div>
                </div>
            </td>
            <td>${p.category}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${p.display_order}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-small btn-edit" onclick="editProject(${p.id})">Edit</button>
                    <button class="btn-small btn-delete" onclick="deleteProject(${p.id})">Delete</button>
                    <button class="btn-small btn-edit" onclick="togglePublish(${p.id}, ${!p.published})">
                        ${p.published ? 'Unpublish' : 'Publish'}
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// --- Modal Logic ---
function openProjectModal() {
    document.getElementById('project-form').reset();
    document.getElementById('project-id').value = '';
    document.getElementById('modal-title').textContent = 'Add Project';
    document.getElementById('current-image-preview').style.display = 'none';
    document.getElementById('project-modal').classList.add('active');
}

function closeProjectModal() {
    document.getElementById('project-modal').classList.remove('active');
}

function editProject(id) {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    
    document.getElementById('project-id').value = p.id;
    document.getElementById('title').value = p.title;
    document.getElementById('category').value = p.category;
    document.getElementById('short_description').value = p.short_description || '';
    document.getElementById('detailed_description').value = p.detailed_description || '';
    
    // Parse JSON safely
    let techs = p.technologies || [];
    if (typeof techs === 'string') { try { techs = JSON.parse(techs); } catch (e) { techs = []; } }
    document.getElementById('technologies').value = techs.join(', ');
    
    let feats = p.features || [];
    if (typeof feats === 'string') { try { feats = JSON.parse(feats); } catch (e) { feats = []; } }
    document.getElementById('features').value = feats.map(f => `- ${f}`).join('\n');
    
    document.getElementById('github_url').value = p.github_url || '';
    document.getElementById('live_demo_url').value = p.live_demo_url || '';
    document.getElementById('display_order').value = p.display_order || 0;
    document.getElementById('published').checked = p.published;
    document.getElementById('featured').checked = p.featured;
    
    if (p.image_url) {
        document.getElementById('current-image-preview').style.display = 'block';
        document.getElementById('preview-img').src = p.image_url;
    } else {
        document.getElementById('current-image-preview').style.display = 'none';
    }
    
    document.getElementById('modal-title').textContent = 'Edit Project';
    document.getElementById('project-modal').classList.add('active');
}

// --- CRUD Operations ---
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('project-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('project-id').value;
            
            const formData = new FormData();
            formData.append('title', document.getElementById('title').value);
            formData.append('category', document.getElementById('category').value);
            formData.append('short_description', document.getElementById('short_description').value);
            formData.append('detailed_description', document.getElementById('detailed_description').value);
            formData.append('github_url', document.getElementById('github_url').value);
            formData.append('live_demo_url', document.getElementById('live_demo_url').value);
            formData.append('display_order', document.getElementById('display_order').value);
            formData.append('published', document.getElementById('published').checked);
            formData.append('featured', document.getElementById('featured').checked);
            
            // Process technologies
            const techString = document.getElementById('technologies').value;
            const techs = techString.split(',').map(t => t.trim()).filter(t => t);
            formData.append('technologies', JSON.stringify(techs));
            
            // Process features
            const featsString = document.getElementById('features').value;
            const feats = featsString.split('\n').map(f => f.replace(/^-/, '').trim()).filter(f => f);
            formData.append('features', JSON.stringify(feats));
            
            // Image
            const imageFile = document.getElementById('image').files[0];
            if (imageFile) {
                formData.append('image', imageFile);
            }
            
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_URL}/admin/projects/${id}` : `${API_URL}/admin/projects`;
            
            try {
                const res = await fetch(url, {
                    method: method,
                    headers: getAuthHeaders(),
                    body: formData // No Content-Type header for FormData, browser sets it with boundary
                });
                
                if (res.ok) {
                    closeProjectModal();
                    fetchAdminProjects();
                } else {
                    alert('Error saving project');
                }
            } catch (err) {
                console.error(err);
                alert('Network error');
            }
        });
    }
});

async function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        try {
            const res = await fetch(`${API_URL}/admin/projects/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) fetchAdminProjects();
            else alert('Failed to delete');
        } catch (err) {
            console.error(err);
        }
    }
}

async function togglePublish(id, publishStatus) {
    try {
        const res = await fetch(`${API_URL}/admin/projects/${id}/status`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ published: publishStatus })
        });
        if (res.ok) fetchAdminProjects();
        else alert('Failed to update status');
    } catch (err) {
        console.error(err);
    }
}

// --- Tab Switching Logic ---
function switchTab(tabName) {
    document.getElementById('nav-projects').classList.remove('active');
    document.getElementById('nav-messages').classList.remove('active');
    
    document.getElementById('section-projects').style.display = 'none';
    document.getElementById('section-messages').style.display = 'none';

    document.getElementById(`nav-${tabName}`).classList.add('active');
    document.getElementById(`section-${tabName}`).style.display = 'block';

    if (tabName === 'messages') {
        fetchAdminMessages();
    }
}

// --- Messages Logic ---
let messages = [];

async function fetchAdminMessages() {
    try {
        const res = await fetch(`${API_URL}/admin/messages`, {
            headers: getAuthHeaders()
        });
        
        if (res.status === 401 || res.status === 403) {
            logoutAdmin();
            return;
        }
        
        messages = await res.json();
        renderMessagesTable();
    } catch (err) {
        console.error('Failed to fetch messages', err);
    }
}

function renderMessagesTable() {
    const tbody = document.getElementById('messages-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">No messages found.</td></tr>';
        return;
    }
    
    messages.forEach(m => {
        const dateStr = new Date(m.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const isUnread = m.status === 'unread';
        const rowStyle = isUnread ? 'background: rgba(255,255,255,0.05); font-weight: 500;' : '';
        
        const row = document.createElement('tr');
        row.style = rowStyle;
        row.innerHTML = `
            <td>${dateStr}</td>
            <td>
                <div><strong>${m.name}</strong></div>
                <div style="font-size: 0.85rem; color: var(--text-muted);"><a href="mailto:${m.email}" style="color: var(--primary); text-decoration:none;">${m.email}</a></div>
            </td>
            <td>${m.subject || '<i>No Subject</i>'}</td>
            <td>
                <div style="max-height: 100px; overflow-y: auto; font-size: 0.9rem; color: var(--text-muted); padding-right: 10px;">
                    ${m.message.replace(/\n/g, '<br>')}
                </div>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-small btn-edit" onclick="toggleMessageStatus(${m.id}, '${isUnread ? 'read' : 'unread'}')">
                        Mark as ${isUnread ? 'Read' : 'Unread'}
                    </button>
                    <button class="btn-small btn-delete" onclick="deleteMessage(${m.id})">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function toggleMessageStatus(id, newStatus) {
    try {
        const res = await fetch(`${API_URL}/admin/messages/${id}/status`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) fetchAdminMessages();
        else alert('Failed to update message status');
    } catch (err) {
        console.error(err);
    }
}

async function deleteMessage(id) {
    if (confirm('Are you sure you want to delete this message?')) {
        try {
            const res = await fetch(`${API_URL}/admin/messages/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) fetchAdminMessages();
            else alert('Failed to delete message');
        } catch (err) {
            console.error(err);
        }
    }
}
