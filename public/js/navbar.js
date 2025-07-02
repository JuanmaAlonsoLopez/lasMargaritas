// Tu código original para el header que se encoge con el scroll
const header = document.getElementById('mainHeader');
window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// --- Lógica del menú hamburguesa ajustada ---

// Crear el botón, tal como lo tenías
const toggleBtn = document.createElement('div');
toggleBtn.className = 'menu-toggle';
toggleBtn.innerHTML = '&#9776;'; // ícono ☰

// Seleccionar los elementos que vamos a manipular
const navContent = document.getElementById('nav-content');
const overlay = document.querySelector('.overlay');

// Al hacer clic, aplicamos la clase 'active' al contenedor y al overlay
toggleBtn.onclick = () => {
    navContent.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.classList.toggle('no-scroll'); // Opcional: Evita que se haga scroll en el fondo
};

// Cerrar menú si se hace clic en el overlay
overlay.onclick = () => {
    navContent.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('no-scroll');
};

// Insertar el botón en el header, tal como lo tenías
const headerInner = document.querySelector('.header-inner');
headerInner.appendChild(toggleBtn);