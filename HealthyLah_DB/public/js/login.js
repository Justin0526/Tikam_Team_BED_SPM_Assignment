
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value;

    const loginMessage = document.getElementById('loginMessage');

    try {
    const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
    });

    const result = await response.json();
    if (response.ok) {
        loginMessage.style.color = 'green';
        loginMessage.textContent = result.message;
        setTimeout(() => {
        window.location.href = 'dashboard.html'; // redirect after 2s
        }, 2000);
    } else {
        loginMessage.style.color = 'red';
        loginMessage.textContent = result.error || 'Login failed.';
    }
    } catch (error) {
    console.error(error);
    loginMessage.style.color = 'red';
    loginMessage.textContent = 'Network error or server not responding.';
    }
});
