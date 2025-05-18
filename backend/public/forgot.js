// forgot.js
document.getElementById('forgotForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = e.target.email.value;

  try {
    const res = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (res.ok) alert(data.message);
    else       alert('Error: ' + (data.message || 'Email not found'));
  } catch (err) {
    console.error(err);
    alert('Could not connect to server');
  }
});
