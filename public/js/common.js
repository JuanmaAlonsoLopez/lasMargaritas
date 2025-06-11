document.addEventListener('DOMContentLoaded', () => {
  const userFromStorage = JSON.parse(localStorage.getItem('user'));
  const tokenFromStorage = localStorage.getItem('token');
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromURL = urlParams.get('token');
  const userFromURL = urlParams.get('user');

  const accountLink = document.querySelector('a[href="#"] img[alt="Ingresar"]')?.parentElement;
  if (!accountLink) return;

  // Si el token está en la URL y el usuario también
  if (tokenFromURL && userFromURL) {
    // Parsear los datos del usuario desde la URL y guardarlos en localStorage
    const user = JSON.parse(decodeURIComponent(userFromURL));
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', tokenFromURL);
    showUserInfo(user);
  } else if (tokenFromStorage && userFromStorage) {
    // Si hay un token y usuario en el localStorage, mostrar la información
    showUserInfo(userFromStorage);
  } else {
    // No hay sesión, mostrar ícono de login
    accountLink.innerHTML = `<img src="../images/logoBanner/account_circle_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg" alt="Ingresar">`;
    accountLink.style.cursor = 'pointer';
    accountLink.addEventListener('click', e => {
      e.preventDefault();
      // Guarda la página actual para redirigir luego del login
      localStorage.setItem('lastPage', window.location.pathname);
      window.location.href = '/login.html';
    });
  }

  // Función para mostrar el nombre y el botón de cerrar sesión
  function showUserInfo(user) {
    accountLink.innerHTML = `<span class="user-name">Hola, ${user.name}</span>`;
    accountLink.style.cursor = 'default';

    // Opcional: agregar botón para cerrar sesión
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Cerrar sesión';
    logoutBtn.className = 'account-link-logout';
    logoutBtn.style.marginLeft = '10px';
    logoutBtn.onclick = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      urlParams.delete('token');
      urlParams.delete('user');
      window.history.replaceState({}, document.title, window.location.pathname + '?' + urlParams.toString());
      location.reload();
    };
    accountLink.appendChild(logoutBtn);
  }
});
