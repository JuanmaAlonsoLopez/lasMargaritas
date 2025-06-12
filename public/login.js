const loginForm = document.getElementById('loginForm');
const loadingOverlay = document.getElementById('loading-overlay');

// Funciones para mostrar/ocultar el loader
const showLoader = () => loadingOverlay.classList.remove('hidden');
const hideLoader = () => loadingOverlay.classList.add('hidden');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = e.target.email.value;
  const password = e.target.password.value;

  showLoader(); // Muestra el loader

  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      hideLoader(); // Oculta el loader antes de la alerta
      return alert('Error: ' + (data.message || 'Credenciales inválidas'));
    }

    // Si el login es exitoso, guarda los datos y redirige.
    // El loader desaparecerá con el cambio de página.
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    const lastPage = localStorage.getItem('lastPage') || '/index.html';
    localStorage.removeItem('lastPage');
    window.location.href = lastPage;

  } catch (err) {
    hideLoader(); // Oculta el loader antes de la alerta de error
    console.error('Fetch error:', err);
    alert('No se pudo conectar con el servidor');
  }
});

// Lógica para Show/Hide contraseña
// (Asegúrate que tu HTML de login tenga los IDs correctos para esto)
const passwordInput = loginForm.querySelector('input[name="password"]');
// const togglePasswordButton = document.getElementById('show-hide'); 

// if (passwordInput && togglePasswordButton) {
//     togglePasswordButton.addEventListener('click', () => {
//         const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
//         passwordInput.setAttribute('type', type);
//         togglePasswordButton.textContent = type === 'password' ? 'Show' : 'Hide';
//     });
// }