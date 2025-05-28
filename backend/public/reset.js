const params = new URLSearchParams(window.location.search);
const token  = params.get('token');
if (!token) throw new Error('Missing token');

document.getElementById('resetForm').addEventListener('submit', async e => {
  e.preventDefault();
  const p1 = e.target.password.value;
  const p2 = e.target.confirmPassword.value;
  if (p1 !== p2) return alert('Passwords do not match');

  const res = await fetch(`http://localhost:3000/api/auth/reset-password/${token}`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ password: p1, confirmPassword: p2 })
  });
  const data = await res.json();
  alert(data.message || 'Error');
  if (res.ok) {
    alert(data.message);
    if (window.opener) {
      window.opener.location.href = '/login.html';
      window.close();
    } else {
      window.location.href = '/login.html';
    }
  }
});
