const productosPorGrupo = 5;
const autoScrollSpeed = 0.3;
const carouselsState = {};

function generateDots(carouselId) {
  const productos = document.querySelectorAll(`#${carouselId} .producto`);
  const totalProductos = productos.length;
  const totalGrupos = Math.ceil(totalProductos / productosPorGrupo);

  const container = document.querySelector(`#${carouselId}`);
  const dotsWrapper = document.createElement('div');
  dotsWrapper.className = 'carousel-controls';

  const leftArrow = document.createElement('button');
  leftArrow.className = 'carousel-arrow';
  leftArrow.innerHTML = '&#9664;';
  leftArrow.onclick = () => moveToSlide(carouselsState[carouselId].currentIndex - 1, carouselId);

  const rightArrow = document.createElement('button');
  rightArrow.className = 'carousel-arrow';
  rightArrow.innerHTML = '&#9654;';
  rightArrow.onclick = () => moveToSlide(carouselsState[carouselId].currentIndex + 1, carouselId);

  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'dots-container';
  dotsContainer.id = `${carouselId}-dots`;

  for (let i = 0; i < totalGrupos; i++) {
    const dot = document.createElement('span');
    dot.classList.add('dot');
    dot.onclick = () => moveToSlide(i, carouselId);
    dotsContainer.appendChild(dot);
  }

  dotsWrapper.appendChild(leftArrow);
  dotsWrapper.appendChild(dotsContainer);
  dotsWrapper.appendChild(rightArrow);

  container.appendChild(dotsWrapper);

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
  const state = carouselsState[carouselId];
  const dots = document.querySelectorAll(`#${carouselId}-dots .dot`);
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === state.currentIndex);
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
    if (newScroll > maxScroll) newScroll = 0;

    carousel.scrollLeft = newScroll;

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