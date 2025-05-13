// Función para generar dinámicamente las pelotitas para cada carrusel
function generateDots(carouselId) {
    const productos = document.querySelectorAll(`#${carouselId} .producto`);
    const productosPorGrupo = 5;
    const totalProductos = productos.length;
    const totalGrupos = Math.ceil(totalProductos / productosPorGrupo);

    const dotsContainer = document.querySelector(`#${carouselId} .dots-container`);
    dotsContainer.innerHTML = ''; // Limpiar pelotitas existentes

    // Crear pelotitas según la cantidad de grupos
    for (let i = 0; i < totalGrupos; i++) {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        dot.onclick = () => moveToSlide(i, carouselId); // Asignar evento de clic
        dotsContainer.appendChild(dot);
    }

    // Inicializar la visualización de los productos
    moveToSlide(0, carouselId);
}

// Función para mover el carrusel a un grupo específico
function moveToSlide(index, carouselId) {
    const productos = document.querySelectorAll(`#${carouselId} .producto`);
    const productosPorGrupo = 5;
    const totalProductos = productos.length;
    const totalGrupos = Math.ceil(totalProductos / productosPorGrupo);

    if (index >= totalGrupos) index = 0;
    if (index < 0) index = totalGrupos - 1;

    const start = index * productosPorGrupo;
    const end = start + productosPorGrupo;

    productos.forEach((producto, i) => {
        if (i >= start && i < end) {
            producto.style.display = 'block'; // Mostrar producto en el grupo actual
        } else {
            producto.style.display = 'none'; // Ocultar productos fuera del grupo
        }
    });

    // Actualizar las pelotitas de navegación
    const dots = document.querySelectorAll(`#${carouselId} .dot`);
    dots.forEach((dot, i) => {
        if (i === index) {
            dot.style.backgroundColor = '#717171'; // Resaltar pelotita activa
        } else {
            dot.style.backgroundColor = '#bbb'; // Restablecer el color de las otras pelotitas
        }
    });
}

// Inicializar todos los carruseles cuando la página cargue
window.onload = () => {
    const carousels = document.querySelectorAll('.carousel-container');
    carousels.forEach(carousel => {
        const carouselId = carousel.id;
        generateDots(carouselId); // Generar pelotitas para cada carrusel
    });
};
