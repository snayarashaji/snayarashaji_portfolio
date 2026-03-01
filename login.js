document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('loginMessage');

    // For now, using a simple local check or we could call a backend API
    // Let's implement a backend check for better security later
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('adminToken', data.token);
            message.style.color = '#10b981';
            message.textContent = 'Login successful! Redirecting...';
            setTimeout(() => {
                window.location.href = '/admin';
            }, 1000);
        } else {
            message.classList.add('error');
            message.textContent = data.error || 'Invalid credentials';
        }
    } catch (err) {
        message.classList.add('error');
        message.textContent = 'Server error. Please try again.';
    }
});

// Check if already logged in
if (localStorage.getItem('adminToken')) {
    window.location.href = '/admin';
}
