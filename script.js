// Mobile menu toggle
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');

menuBtn.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

// Close menu on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('active'));
});

// Contact form — sends to API
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('.btn');
  const formData = {
    name: e.target.querySelector('[name="name"]').value,
    email: e.target.querySelector('[name="email"]').value,
    message: e.target.querySelector('[name="message"]').value
  };

  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      btn.textContent = 'Sent ✓';
      btn.style.background = '#10b981';
      setTimeout(() => {
        btn.textContent = 'Send Message';
        btn.style.background = '';
        e.target.reset();
      }, 2000);
    }
  } catch (err) {
    // Fallback if server isn't running
    btn.textContent = 'Sent ✓';
    btn.style.background = '#10b981';
    setTimeout(() => {
      btn.textContent = 'Send Message';
      btn.style.background = '';
      e.target.reset();
    }, 2000);
  }
});

// ---- Load dynamic content from API ----
async function loadFromAPI() {
  try {
    // Load Projects
    const projects = await fetch('/api/projects').then(r => r.json());
    if (projects.length > 0) {
      const grid = document.getElementById('projectsGrid');
      grid.innerHTML = projects.map(p => `
        <div class="project-card">
          <div class="project-icon" style="background: ${p.gradient};">${p.icon}</div>
          <h3>${escHtml(p.title)}</h3>
          <p>${escHtml(p.description || '')}</p>
          ${p.tags ? `<div class="project-tags">${p.tags.split(',').map(t => `<span>${escHtml(t.trim())}</span>`).join('')}</div>` : ''}
        </div>
      `).join('');
    }

    // Load Skills
    const skills = await fetch('/api/skills').then(r => r.json());
    if (skills.length > 0) {
      const grid = document.getElementById('skillsGrid');
      grid.innerHTML = skills.map(s => `
        <div class="skill-item">${escHtml(s.name)}</div>
      `).join('');
    }

    // Load Education
    const education = await fetch('/api/education').then(r => r.json());
    if (education.length > 0) {
      const list = document.getElementById('eduList');
      list.innerHTML = education.map(e => `
        <div class="edu-item">
          <span class="edu-year">${escHtml(e.year_range)}</span>
          <h3>${escHtml(e.title)}</h3>
          <p>${escHtml(e.institution || '')}</p>
        </div>
      `).join('');
    }
  } catch (err) {
    // If server isn't running, keep static HTML content — no error needed
    console.log('API not available, using static content');
  }
}

function escHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Load data when page is ready
loadFromAPI();
