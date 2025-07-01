// =================================================================
// MANEJO DE LA SESIÓN DE USUARIO Y UI DEL HEADER
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Función principal que se ejecuta al cargar la página.
  handleUserSession();
});

/**
 * Gestiona la sesión del usuario.
 * 1. Revisa si hay un token en la URL (recién logueado).
 * 2. Si es así, lo guarda en localStorage y limpia la URL.
 * 3. Luego, lee desde localStorage para mostrar la UI correcta.
 */
function handleUserSession() {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromURL = urlParams.get('token');
  const userFromURL = urlParams.get('user');

  // Si hay un token y usuario en la URL, significa que el usuario acaba de iniciar sesión.
  if (tokenFromURL && userFromURL) {
    try {
      const user = JSON.parse(decodeURIComponent(userFromURL));
      localStorage.setItem('token', tokenFromURL);
      localStorage.setItem('user', JSON.stringify(user));

      // Limpia la URL para que el token y los datos no queden expuestos.
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {
      console.error("Error al procesar los datos del usuario desde la URL", e);
      // Si falla, limpia los datos de sesión por seguridad.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  // Ahora, lee desde localStorage como única fuente de verdad.
  const tokenFromStorage = localStorage.getItem('token');
  const userFromStorage = JSON.parse(localStorage.getItem('user'));

  if (tokenFromStorage && userFromStorage) {
    // Si hay sesión, muestra la información del usuario.
    displayUserInfo(userFromStorage);
  } else {
    // Si no hay sesión, muestra el botón de login.
    displayLoginButton();
  }
}

/**
 * Muestra la información del usuario (nombre y botones de admin/logout).
 * @param {object} user - El objeto del usuario con 'name' y 'role'.
 */
function displayUserInfo(user) {
  // Es más robusto usar un ID para el contenedor del usuario.
  const userContainer = document.getElementById('user-session-container');
  if (!userContainer) return;

  userContainer.innerHTML = ''; // Limpia el contenido anterior.
  userContainer.style.cursor = 'default';
  
  // Muestra el saludo al usuario.
  const userNameSpan = document.createElement('span');
  userNameSpan.className = 'user-name';
  userNameSpan.textContent = `Hola, ${user.name}`;
  userContainer.appendChild(userNameSpan);

  // Muestra el botón "Administrador" si el rol es 1.
  if (user.role === 1) {
    const adminButton = document.createElement('button');
    adminButton.textContent = 'Administrador';
    adminButton.className = 'admin-button';
    adminButton.onclick = () => window.location.href = '/pages/admin.html';
    userContainer.appendChild(adminButton);
  }

  // Muestra el botón para cerrar sesión.
  const logoutBtn = document.createElement('button');
  logoutBtn.textContent = 'Cerrar sesión';
  logoutBtn.className = 'logout-button';
  logoutBtn.onclick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Recarga la página para reflejar el estado de logout.
    location.reload(); 
  };
  userContainer.appendChild(logoutBtn);
}

/**
 * Muestra el ícono y la funcionalidad para iniciar sesión.
 */
function displayLoginButton() {
  const userContainer = document.getElementById('user-session-container');
  if (!userContainer) return;

  userContainer.innerHTML = `<img src="/images/logoBanner/account_circle_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg" alt="Ingresar">`;
  userContainer.style.cursor = 'pointer';
  
  userContainer.onclick = (e) => {
    e.preventDefault();
    // Guarda la página actual para poder redirigir de vuelta después del login.
    localStorage.setItem('lastPage', window.location.pathname + window.location.search);
    window.location.href = '/login.html';
  };
}

// =================================================================
// FUNCIONES GLOBALES DEL CARRITO (solución al bug anterior)
// =================================================================

// Hacemos estas funciones globales para que carousel.js pueda acceder a ellas.
window.addToCart = function(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingProductIndex = cart.findIndex(item => item.id == product.id);

    if (existingProductIndex > -1) {
        cart[existingProductIndex].quantity += 1;
    } else {
        product.quantity = 1;
        cart.push(product);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
}

window.updateCartUI = function() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCounter = document.getElementById('cart-count');
    if (cartCounter) {
        cartCounter.textContent = cartCount;
    }
}

// Actualiza el contador del carrito al cargar la página.
document.addEventListener('DOMContentLoaded', window.updateCartUI);