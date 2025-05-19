document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name    = e.target.name.value;
  const email   = e.target.email.value;
  const password= e.target.password.value;
  const confirm = e.target.confirmPassword.value;

  if (password !== confirm) {
    return alert('Passwords do not match');
  }

  const res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ name, email, password, confirmPassword: confirm })
  });
  const data = await res.json();
  alert(data.message || 'Error');
});

