const registerForm = document.getElementById('registerForm');
const loadingOverlay = document.getElementById('loading-overlay');

// Funciones para mostrar/ocultar el loader
const showLoader = () => loadingOverlay.classList.remove('hidden');
const hideLoader = () => loadingOverlay.classList.add('hidden');

registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = e.target.name.value;
  const email = e.target.email.value;
  const password = e.target.password.value;
  const confirm = e.target.confirmPassword.value;

  if (password !== confirm) {
    return alert('Las contraseñas no coinciden');
  }

  showLoader(); // Muestra el loader

  try {
    // ✅ ¡CORRECCIÓN! Se usa una ruta relativa para que funcione en producción.
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, email, password, confirmPassword: confirm })
    });
    const data = await res.json();
    
    hideLoader(); // Oculta el loader antes de la alerta
    alert(data.message || 'Error');
    
    if (res.ok) {
        window.location.href = '/login.html'; // Redirige al login si el registro fue exitoso
    }

  } catch (error) {
    hideLoader(); // Oculta el loader en caso de error de red
    console.error('Error en el registro:', error);
    alert('No se pudo conectar con el servidor.');
  }
});