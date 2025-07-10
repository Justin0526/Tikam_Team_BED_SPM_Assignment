
document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const fullname = document.getElementById('fullname').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    const resultMessage = document.getElementById('resultMessage');

    try {
    const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        fullname,
        username,
        email,
        password,
        confirmPassword
        })
    });

    const result = await response.json();
    if (response.ok) {
        resultMessage.style.color = 'green';
        resultMessage.textContent = result.message;
        document.getElementById('registerForm').reset();
        setTimeout(() => {
        window.location.href = 'login.html'; // redirect after 2s
        }, 2000);
    } else {
        resultMessage.style.color = 'red';
        resultMessage.textContent = result.error || 'Something went wrong.';
    }
    } catch (error) {
    console.error(error);
    resultMessage.style.color = 'red';
    resultMessage.textContent = 'Network error or server not responding.';
    }
});
