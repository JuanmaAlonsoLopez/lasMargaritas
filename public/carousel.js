// =================================================================
// ESTADO Y CONFIGURACIÓN GLOBAL DEL CARRUSEL
// =================================================================
const productosPorGrupo = 5;
const autoScrollSpeed = 0.3;
const carouselsState = {};

// =================================================================
// INICIALIZACIÓN PRINCIPAL
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Carga los productos y crea los carruseles.
  initializeAllCarousels();

  // 2. Configura el listener de eventos para "Agregar al Carrito" (SOLUCIÓN AL BUG).
  // setupAddToCartListener();

  // 3. Inicia el auto-scroll de los carruseles.
  requestAnimationFrame(autoScrollTick);
});

// =================================================================
// LÓGICA DE CREACIÓN DE CARRUSELES
// =================================================================

function initializeAllCarousels() {
  fetch('/api/products')
    .then(response => response.json())
    .then(products => {
      // Filtra productos por categoría (puedes ajustar los IDs).
      const ortopedicaProducts = products.filter(p => p.category_id === 1);
      const confortProducts = products.filter(p => p.category_id === 1);
      const babyProducts = products.filter(p => p.category_id === 3);

      // Crea cada carrusel con sus productos.
      createCarousel('confort-carousel', 'Línea Confort', confortProducts);
      createCarousel('baby-carousel', 'Línea Baby', babyProducts);
      createCarousel('ortopedica-carousel', 'Línea Ortopédica', ortopedicaProducts);
    })
    .catch(error => console.error('Error al cargar productos para carruseles:', error));
}

function createCarousel(carouselId, title, products) {
  const container = document.getElementById(carouselId);
  if (!container) return;

  // Genera el HTML para todas las tarjetas de producto.
  const productCardsHTML = products.map(product => createProductCardHTML(product)).join('');

  // Inserta la estructura básica del carrusel en el contenedor.
  container.innerHTML = `
    <h2 class="carousel-title">${title}</h2>
    <div class="productos-wrapper">
      <div class="productos">
        ${productCardsHTML}
      </div>
    </div>
  `;

  // Genera y añade los controles (flechas y puntos).
  generateCarouselControls(carouselId);
}

// **MODIFICADO**: Esta función ahora solo devuelve el HTML de la tarjeta.
// No añade ningún event listener, lo que previene el bug de duplicación.
function createProductCardHTML(product) {
  const formattedPrice = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(product.price);
  const imageUrl = product.image_url; 
  return `
    <div class="producto" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-image="${imageUrl}">
      <a href="/pages/Prod.Individual.html?id=${product.id}">
        <img src="${imageUrl}" alt="${product.name}" class="product-image">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">${formattedPrice}</p>
      </a>
      <button class="agregar-carrito">Agregar al carrito</button>
    </div>
  `;
}


// =================================================================
// SOLUCIÓN AL BUG: DELEGACIÓN DE EVENTOS PARA "AGREGAR AL CARRITO"
// =================================================================

document.body.addEventListener('click', (event) => {
        if (event.target.classList.contains('agregar-carrito')) {
            const productCard = event.target.closest('.producto');
            if (productCard) {
                const product = {
                    id: parseInt(productCard.dataset.id), name: productCard.dataset.name,
                    price: parseFloat(productCard.dataset.price), image: productCard.dataset.image,
                    quantity: 1
                };
                addToCart(product);
                updateCartIconBadge()
            }
            updateCartIconBadge()
        }
    });


// =================================================================
// LÓGICA DE CONTROLES Y NAVEGACIÓN DEL CARRUSEL (Tu código original, adaptado)
// =================================================================

function generateCarouselControls(carouselId) {
  const productos = document.querySelectorAll(`#${carouselId} .producto`);
  const totalProductos = productos.length;
  if (totalProductos === 0) return;
  
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
  if (!dots) return;
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === state.currentIndex);
  });
}

function moveToSlide(index, carouselId, pauseAutoScroll = true) {
  const carousel = document.querySelector(`#${carouselId} .productos`);
  const state = carouselsState[carouselId];
  if (!carousel || !state) return;

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
    if (!state || !state.isAutoScrolling) return;

    const carousel = document.querySelector(`#${carouselId} .productos`);
    if (!carousel) return;
    
    const producto = carousel.querySelector('.producto');
    if (!producto) return;

    const style = getComputedStyle(producto);
    const productoWidth = producto.getBoundingClientRect().width + parseFloat(style.marginRight);
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;

    let newScroll = carousel.scrollLeft + autoScrollSpeed;
    if (newScroll >= maxScroll) {
        newScroll = 0; // Vuelve al inicio
        state.currentIndex = 0;
    } else {
        const newIndex = Math.floor(newScroll / (productoWidth * productosPorGrupo));
        if (newIndex !== state.currentIndex) {
            state.currentIndex = newIndex;
        }
    }
    
    carousel.scrollLeft = newScroll;
    updateDots(carouselId);
  });

  requestAnimationFrame(autoScrollTick);
}