const resetForm = document.getElementById('resetForm');
const loadingOverlay = document.getElementById('loading-overlay');

// Funciones para mostrar/ocultar el loader
const showLoader = () => loadingOverlay.classList.remove('hidden');
const hideLoader = () => loadingOverlay.classList.add('hidden');

// Obtener el token de la URL
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

if (!token) {
    alert('Token inválido o no encontrado. Por favor, solicita un nuevo enlace para restablecer la contraseña.');
    // Deshabilitar el formulario si no hay token
    resetForm.innerHTML = '<p style="text-align: center; color: red;">Enlace inválido.</p><p><a href="login.html">Volver al Login</a></p>';
}

resetForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!token) return; // No hacer nada si no hay token

  const p1 = e.target.password.value;
  const p2 = e.target.confirmPassword.value;

  if (p1 !== p2) {
      return alert('Las contraseñas no coinciden');
  }
  if (p1.length < 6) {
      return alert('La contraseña debe tener al menos 6 caracteres.');
  }

  showLoader(); // Muestra el loader

  try {
    const res = await fetch(`http://localhost:3000/api/auth/reset-password/${token}`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ password: p1, confirmPassword: p2 })
    });
    const data = await res.json();

    hideLoader(); // Oculta el loader antes de la alerta
    alert(data.message || 'Error');

    if (res.ok) {
        // Redirigir al login
        window.location.href = '/login.html';
    }

  } catch (error) {
      hideLoader();
      console.error('Error al restablecer contraseña:', error);
      alert('No se pudo conectar con el servidor.');
  }
});