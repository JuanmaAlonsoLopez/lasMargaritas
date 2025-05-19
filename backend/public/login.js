// login.js
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = e.target.email.value;
  const password = e.target.password.value;

  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      // Si las credenciales son inválidas
      return alert('Error: ' + (data.message || 'Invalid credentials'));
    }

    // Si todo va bien, guardamos el token y el usuario
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    alert('¡Login exitoso!');
    // Redirigir a la página que desees, por ejemplo:
    window.location.href = 'http://127.0.0.1:5500/index.html';
  } catch (err) {
    console.error('Fetch error:', err);
    alert('No se pudo conectar con el servidor');
  }
});
