// ============ Admin Panel JavaScript ============

const API = '';
const token = localStorage.getItem('adminToken');

// ---- Tab Navigation ----
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        tabContents.forEach(t => t.classList.remove('active'));
        document.getElementById('tab-' + tab).classList.add('active');
        // Close sidebar on mobile
        document.getElementById('sidebar').classList.remove('open');
    });
});

// Mobile hamburger
document.getElementById('hamburgerBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// ---- Toast ----
function showToast(msg) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// ---- Fetch Helpers ----
async function apiGet(url) {
    const res = await fetch(API + url, {
        headers: { 'Authorization': token }
    });
    if (res.status === 403) logout();
    return res.json();
}

async function apiPost(url, data) {
    const res = await fetch(API + url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify(data)
    });
    if (res.status === 403) logout();
    return res.json();
}

async function apiPut(url, data) {
    const res = await fetch(API + url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify(data)
    });
    if (res.status === 403) logout();
    return res.json();
}

async function apiDelete(url) {
    const res = await fetch(API + url, {
        method: 'DELETE',
        headers: { 'Authorization': token }
    });
    if (res.status === 403) logout();
    return res.json();
}

function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
}

document.getElementById('logoutBtn').addEventListener('click', logout);

// ============ DASHBOARD ============
async function loadDashboard() {
    try {
        const stats = await apiGet('/api/stats');
        document.getElementById('statProjects').textContent = stats.projects;
        document.getElementById('statSkills').textContent = stats.skills;
        document.getElementById('statEducation').textContent = stats.education;
        document.getElementById('statMessages').textContent = stats.messages;

        // Update unread badge
        const badge = document.getElementById('msgBadge');
        if (stats.unreadMessages > 0) {
            badge.style.display = 'inline';
            badge.textContent = stats.unreadMessages;
        } else {
            badge.style.display = 'none';
        }

        // Recent messages
        const messages = await apiGet('/api/messages');
        const container = document.getElementById('recentMessages');
        if (messages.length === 0) {
            container.innerHTML = '<p class="empty-state">No messages yet</p>';
        } else {
            container.innerHTML = messages.slice(0, 5).map(m => `
                <div class="message-card ${m.is_read ? '' : 'unread'}">
                    <div class="msg-header">
                        <span class="msg-name">${escHtml(m.name)}</span>
                        <span class="msg-date">${formatDate(m.created_at)}</span>
                    </div>
                    <p class="msg-body">${escHtml(m.message).substring(0, 100)}${m.message.length > 100 ? '...' : ''}</p>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Dashboard load error:', err);
        document.getElementById('recentMessages').innerHTML = '<p class="empty-state">⚠️ Could not connect to server</p>';
    }
}

// ============ PROJECTS ============
const projectForm = document.getElementById('projectForm');
const addProjectBtn = document.getElementById('addProjectBtn');
const cancelProjectBtn = document.getElementById('cancelProjectBtn');
const saveProjectBtn = document.getElementById('saveProjectBtn');

addProjectBtn.addEventListener('click', () => {
    document.getElementById('projectFormTitle').textContent = 'Add Project';
    document.getElementById('projectId').value = '';
    document.getElementById('projectTitle').value = '';
    document.getElementById('projectDesc').value = '';
    document.getElementById('projectIcon').value = '';
    document.getElementById('projectTags').value = '';
    document.getElementById('projectGradient').selectedIndex = 0;
    projectForm.classList.remove('hidden');
    addProjectBtn.style.display = 'none';
});

cancelProjectBtn.addEventListener('click', () => {
    projectForm.classList.add('hidden');
    addProjectBtn.style.display = '';
});

saveProjectBtn.addEventListener('click', async () => {
    const id = document.getElementById('projectId').value;
    const data = {
        title: document.getElementById('projectTitle').value.trim(),
        description: document.getElementById('projectDesc').value.trim(),
        icon: document.getElementById('projectIcon').value.trim() || '📁',
        gradient: document.getElementById('projectGradient').value,
        tags: document.getElementById('projectTags').value.trim()
    };

    if (!data.title) return showToast('Title is required');

    try {
        if (id) {
            await apiPut('/api/projects/' + id, data);
            showToast('Project updated!');
        } else {
            await apiPost('/api/projects', data);
            showToast('Project added!');
        }
        projectForm.classList.add('hidden');
        addProjectBtn.style.display = '';
        loadProjects();
        loadDashboard();
    } catch (err) {
        showToast('Error saving project');
    }
});

async function loadProjects() {
    try {
        const projects = await apiGet('/api/projects');
        const container = document.getElementById('projectsList');

        if (projects.length === 0) {
            container.innerHTML = '<p class="empty-state">No projects yet. Add your first project!</p>';
            return;
        }

        container.innerHTML = projects.map(p => `
            <div class="item-card">
                <div class="item-icon" style="background: ${p.gradient};">${escHtml(p.icon)}</div>
                <div class="item-body">
                    <h3>${escHtml(p.title)}</h3>
                    <p>${escHtml(p.description || '')}</p>
                    ${p.tags ? `<div class="item-tags">${p.tags.split(',').map(t => `<span>${escHtml(t.trim())}</span>`).join('')}</div>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn btn-outline btn-sm" onclick="editProject(${p.id}, ${escAttr(JSON.stringify(p))})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProject(${p.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        document.getElementById('projectsList').innerHTML = '<p class="empty-state">⚠️ Could not load projects</p>';
    }
}

window.editProject = function (id, project) {
    document.getElementById('projectFormTitle').textContent = 'Edit Project';
    document.getElementById('projectId').value = id;
    document.getElementById('projectTitle').value = project.title;
    document.getElementById('projectDesc').value = project.description || '';
    document.getElementById('projectIcon').value = project.icon || '';
    document.getElementById('projectTags').value = project.tags || '';
    // Try to match gradient
    const sel = document.getElementById('projectGradient');
    for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === project.gradient) {
            sel.selectedIndex = i;
            break;
        }
    }
    projectForm.classList.remove('hidden');
    addProjectBtn.style.display = 'none';
};

window.deleteProject = async function (id) {
    if (!confirm('Delete this project?')) return;
    try {
        await apiDelete('/api/projects/' + id);
        showToast('Project deleted');
        loadProjects();
        loadDashboard();
    } catch (err) {
        showToast('Error deleting project');
    }
};

// ============ SKILLS ============
document.getElementById('addSkillBtn').addEventListener('click', async () => {
    const input = document.getElementById('skillName');
    const name = input.value.trim();
    if (!name) return showToast('Enter a skill name');

    try {
        await apiPost('/api/skills', { name });
        input.value = '';
        showToast('Skill added!');
        loadSkills();
        loadDashboard();
    } catch (err) {
        showToast('Error adding skill');
    }
});

// Allow Enter key to add skill
document.getElementById('skillName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('addSkillBtn').click();
});

async function loadSkills() {
    try {
        const skills = await apiGet('/api/skills');
        const container = document.getElementById('skillsList');

        if (skills.length === 0) {
            container.innerHTML = '<p class="empty-state">No skills added yet</p>';
            return;
        }

        container.innerHTML = skills.map(s => `
            <div class="tag-chip">
                ${escHtml(s.name)}
                <button class="delete-tag" onclick="deleteSkill(${s.id})" title="Remove">✕</button>
            </div>
        `).join('');
    } catch (err) {
        document.getElementById('skillsList').innerHTML = '<p class="empty-state">⚠️ Could not load skills</p>';
    }
}

window.deleteSkill = async function (id) {
    if (!confirm('Remove this skill?')) return;
    try {
        await apiDelete('/api/skills/' + id);
        showToast('Skill removed');
        loadSkills();
        loadDashboard();
    } catch (err) {
        showToast('Error removing skill');
    }
};

// ============ EDUCATION ============
const educationForm = document.getElementById('educationForm');
const addEducationBtn = document.getElementById('addEducationBtn');
const cancelEduBtn = document.getElementById('cancelEduBtn');
const saveEduBtn = document.getElementById('saveEduBtn');

addEducationBtn.addEventListener('click', () => {
    document.getElementById('eduFormTitle').textContent = 'Add Education';
    document.getElementById('eduId').value = '';
    document.getElementById('eduYear').value = '';
    document.getElementById('eduTitle').value = '';
    document.getElementById('eduInstitution').value = '';
    educationForm.classList.remove('hidden');
    addEducationBtn.style.display = 'none';
});

cancelEduBtn.addEventListener('click', () => {
    educationForm.classList.add('hidden');
    addEducationBtn.style.display = '';
});

saveEduBtn.addEventListener('click', async () => {
    const id = document.getElementById('eduId').value;
    const data = {
        year_range: document.getElementById('eduYear').value.trim(),
        title: document.getElementById('eduTitle').value.trim(),
        institution: document.getElementById('eduInstitution').value.trim()
    };

    if (!data.year_range || !data.title) return showToast('Year and Title are required');

    try {
        if (id) {
            await apiPut('/api/education/' + id, data);
            showToast('Education updated!');
        } else {
            await apiPost('/api/education', data);
            showToast('Education added!');
        }
        educationForm.classList.add('hidden');
        addEducationBtn.style.display = '';
        loadEducation();
        loadDashboard();
    } catch (err) {
        showToast('Error saving education');
    }
});

async function loadEducation() {
    try {
        const education = await apiGet('/api/education');
        const container = document.getElementById('educationList');

        if (education.length === 0) {
            container.innerHTML = '<p class="empty-state">No education entries yet</p>';
            return;
        }

        container.innerHTML = education.map(e => `
            <div class="item-card">
                <div class="item-icon" style="background: rgba(124,58,237,0.1);">🎓</div>
                <div class="item-body">
                    <h3>${escHtml(e.title)}</h3>
                    <p>${escHtml(e.institution || '')} • ${escHtml(e.year_range)}</p>
                </div>
                <div class="item-actions">
                    <button class="btn btn-outline btn-sm" onclick="editEducation(${e.id}, ${escAttr(JSON.stringify(e))})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteEducation(${e.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        document.getElementById('educationList').innerHTML = '<p class="empty-state">⚠️ Could not load education</p>';
    }
}

window.editEducation = function (id, education) {
    document.getElementById('eduFormTitle').textContent = 'Edit Education';
    document.getElementById('eduId').value = id;
    document.getElementById('eduYear').value = education.year_range;
    document.getElementById('eduTitle').value = education.title;
    document.getElementById('eduInstitution').value = education.institution || '';
    educationForm.classList.remove('hidden');
    addEducationBtn.style.display = 'none';
};

window.deleteEducation = async function (id) {
    if (!confirm('Delete this entry?')) return;
    try {
        await apiDelete('/api/education/' + id);
        showToast('Education deleted');
        loadEducation();
        loadDashboard();
    } catch (err) {
        showToast('Error deleting education');
    }
};

// ============ MESSAGES ============
async function loadMessages() {
    try {
        const messages = await apiGet('/api/messages');
        const container = document.getElementById('messagesList');

        if (messages.length === 0) {
            container.innerHTML = '<p class="empty-state">No messages yet. Messages from your contact form will appear here.</p>';
            return;
        }

        container.innerHTML = messages.map(m => `
            <div class="message-card ${m.is_read ? '' : 'unread'}">
                <div class="msg-header">
                    <div>
                        <span class="msg-name">${escHtml(m.name)}</span>
                        <span class="msg-email"> — ${escHtml(m.email)}</span>
                    </div>
                    <span class="msg-date">${formatDate(m.created_at)}</span>
                </div>
                <p class="msg-body">${escHtml(m.message)}</p>
                <div class="msg-actions">
                    ${!m.is_read ? `<button class="btn btn-success btn-sm" onclick="markRead(${m.id})">Mark Read</button>` : ''}
                    <button class="btn btn-danger btn-sm" onclick="deleteMessage(${m.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        document.getElementById('messagesList').innerHTML = '<p class="empty-state">⚠️ Could not load messages</p>';
    }
}

window.markRead = async function (id) {
    try {
        await apiPut('/api/messages/' + id + '/read', {});
        showToast('Marked as read');
        loadMessages();
        loadDashboard();
    } catch (err) {
        showToast('Error updating message');
    }
};

window.deleteMessage = async function (id) {
    if (!confirm('Delete this message?')) return;
    try {
        await apiDelete('/api/messages/' + id);
        showToast('Message deleted');
        loadMessages();
        loadDashboard();
    } catch (err) {
        showToast('Error deleting message');
    }
};

// ---- Helpers ----
function escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escAttr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---- Init ----
loadDashboard();
loadProjects();
loadSkills();
loadEducation();
loadMessages();
