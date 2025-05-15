// Obtenemos el header
const header = document.querySelector('header');

// Escuchamos el evento de scroll
window.addEventListener('scroll', () => {
    // Verificamos si la posición del scroll es mayor que 0
    if (window.scrollY > 0) {
        header.classList.add('fixed');
    } else {
        header.classList.remove('fixed');
    }
});

const btnHamburguesa = document.getElementById('btnHamburguesa');
const menuHamburguesa = document.getElementById('menuHamburguesaResponsive');

btnHamburguesa.addEventListener('click', () => {
    menuHamburguesa.classList.toggle('activo');
});
