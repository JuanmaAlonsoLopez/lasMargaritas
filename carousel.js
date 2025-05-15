const productosPorGrupo = 5;
const autoScrollSpeed = 0.3; // px por frame, ajusta si quieres más lento

const carouselsState = {};

function generateDots(carouselId) {
    const productos = document.querySelectorAll(`#${carouselId} .producto`);
    const totalProductos = productos.length;
    const totalGrupos = Math.ceil(totalProductos / productosPorGrupo);

    const dotsContainer = document.querySelector(`#${carouselId} .dots-container`);
    dotsContainer.innerHTML = '';

    for (let i = 0; i < totalGrupos; i++) {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        dot.onclick = () => moveToSlide(i, carouselId);
        dotsContainer.appendChild(dot);
    }

    carouselsState[carouselId] = {
        currentIndex: 0,
        totalGrupos,
        isAutoScrolling: true,
        autoScrollTimeout: null,
    };

    updateDots(carouselId);
    moveToSlide(0, carouselId, false);
}

function updateDots(carouselId) {
    const dots = document.querySelectorAll(`#${carouselId} .dot`);
    const state = carouselsState[carouselId];
    dots.forEach((dot, i) => {
        dot.style.backgroundColor = (i === state.currentIndex) ? '#717171' : '#bbb';
    });
}

function moveToSlide(index, carouselId, pauseAutoScroll = true) {
    const carousel = document.querySelector(`#${carouselId} .productos`);
    const state = carouselsState[carouselId];

    if (index >= state.totalGrupos) index = 0;
    if (index < 0) index = state.totalGrupos - 1;

    state.currentIndex = index;

    const producto = carousel.querySelector('.producto');
    if (!producto) return;

    const style = getComputedStyle(producto);
    const productoWidth = producto.getBoundingClientRect().width + parseFloat(style.marginRight);

    const scrollPosition = productoWidth * productosPorGrupo * index;

    // SOLO aquí usar scrollTo con smooth para saltos puntuales
    carousel.scrollTo({ left: scrollPosition, behavior: 'smooth' });

    updateDots(carouselId);

    if (pauseAutoScroll) {
        pauseAutoScrollFor(carouselId, 5000);
    }
}

function pauseAutoScrollFor(carouselId, duration) {
    const state = carouselsState[carouselId];
    if (!state) return;
    state.isAutoScrolling = false;

    if (state.autoScrollTimeout) clearTimeout(state.autoScrollTimeout);

    state.autoScrollTimeout = setTimeout(() => {
        state.isAutoScrolling = true;
    }, duration);
}

function autoScrollTick() {
    Object.keys(carouselsState).forEach(carouselId => {
        const state = carouselsState[carouselId];
        if (!state.isAutoScrolling) return;

        const carousel = document.querySelector(`#${carouselId} .productos`);
        const producto = carousel.querySelector('.producto');
        if (!producto) return;

        const style = getComputedStyle(producto);
        const productoWidth = producto.getBoundingClientRect().width + parseFloat(style.marginRight);
        const maxScroll = productoWidth * state.totalGrupos * productosPorGrupo - carousel.clientWidth;

        let newScroll = carousel.scrollLeft + autoScrollSpeed;
        if (newScroll > maxScroll) {
            newScroll = 0;
        }

        // Asignamos directamente scrollLeft, no scrollTo con smooth aquí
        carousel.scrollLeft = newScroll;

        // Actualizar índice para las pelotitas según scroll actual
        const newIndex = Math.floor(newScroll / (productoWidth * productosPorGrupo));
        if (newIndex !== state.currentIndex) {
            state.currentIndex = newIndex;
            updateDots(carouselId);
        }
    });

    requestAnimationFrame(autoScrollTick);
}

window.onload = () => {
    const carousels = document.querySelectorAll('.carousel-container');
    carousels.forEach(carousel => {
        generateDots(carousel.id);
    });
    requestAnimationFrame(autoScrollTick);
};
