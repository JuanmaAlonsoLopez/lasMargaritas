// reset.js
const params = new URLSearchParams(window.location.search);
const token  = params.get('token');

if (!token) {
  alert('No reset token provided');
  throw new Error('Missing token');
}

document.getElementById('resetForm').addEventListener('submit', async e => {
  e.preventDefault();
  const password = e.target.password.value;

  try {
    const res = await fetch(`http://localhost:3000/api/auth/reset-password/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      window.location.href = 'login.html';
    } else {
      alert('Error: ' + (data.message || 'Invalid or expired token'));
    }
  } catch (err) {
    console.error(err);
    alert('Could not connect to server');
  }
});
