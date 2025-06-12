const forgotForm = document.getElementById('forgotForm');
const loadingOverlay = document.getElementById('loading-overlay');

// Funciones para mostrar/ocultar el loader
const showLoader = () => loadingOverlay.classList.remove('hidden');
const hideLoader = () => loadingOverlay.classList.add('hidden');

forgotForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = e.target.email.value;

  showLoader(); // Muestra el loader

  try {
    const res = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();

    hideLoader(); // Oculta el loader antes de la alerta
    
    if (res.ok) {
        alert(data.message);
    } else {
        alert('Error: ' + (data.message || 'Email no encontrado'));
    }

  } catch (err) {
    hideLoader(); // Oculta el loader en caso de error de red
    console.error(err);
    alert('No se pudo conectar con el servidor');
  }
});