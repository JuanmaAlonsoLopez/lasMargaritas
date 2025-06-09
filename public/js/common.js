document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  const accountLink = document.querySelector('a[href="#"] img[alt="Ingresar"]')?.parentElement;
  if (!accountLink) return;

  if (token && user) {
    // Mostrar nombre en lugar del ícono
    accountLink.innerHTML = `<span class="user-name">Hola, ${user.name}</span>`;
    accountLink.style.cursor = 'default';

    // Opcional: agregar botón para cerrar sesión
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Cerrar sesión';
    logoutBtn.style.marginLeft = '10px';
    logoutBtn.onclick = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      location.reload();
    };
    accountLink.appendChild(logoutBtn);

  } else {
    // No hay sesión, ícono normal y clic redirige a login
    accountLink.innerHTML = `<img src="../images/logoBanner/account_circle_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg" alt="Ingresar">`;
    accountLink.style.cursor = 'pointer';
    accountLink.addEventListener('click', e => {
      e.preventDefault();
      // Guarda la página actual para redirigir luego del login
      localStorage.setItem('lastPage', window.location.pathname);
      window.location.href = '/login.html';
    });
  }
});
