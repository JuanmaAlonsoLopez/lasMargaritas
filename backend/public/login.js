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

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirigir a la página anterior o a home
      const lastPage = localStorage.getItem('lastPage') || '/index.html';
      localStorage.removeItem('lastPage');
      window.location.href = lastPage;
    }
  } catch (err) {
    console.error('Fetch error:', err);
    alert('No se pudo conectar con el servidor');
  }
});

// Show/Hide contraseña
const passwordInput = document.getElementById('password');
const togglePasswordButton = document.getElementById('show-hide');  // Cambié aquí el id

togglePasswordButton.addEventListener('click', () => {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  togglePasswordButton.textContent = type === 'password' ? 'Show' : 'Hide';
});


