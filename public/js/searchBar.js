// public/js/searchBar.js

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM
    const searchIconBtn = document.getElementById('search-icon-btn'); // Botón para abrir el buscador
    const searchModal = document.getElementById('search-modal');       // El overlay/modal completo
    const closeSearchModalBtn = document.getElementById('close-search-modal'); // Botón para cerrar el modal
    const searchInput = document.getElementById('search-input');       // Input de búsqueda
    const searchResultsContainer = document.getElementById('search-results-container'); // Contenedor de resultados
    const noResultsMessage = document.getElementById('no-results-message'); // Mensaje de "no resultados"

    let searchTimeout; // Variable para el temporizador de "debounce"
    const SEARCH_DELAY = 300; // Retraso en milisegundos para la búsqueda (evita muchas peticiones)

    // =========================================================
    // FUNCIONES PARA CONTROLAR EL MODAL
    // =========================================================

    function openSearchModal() {
        searchModal.classList.remove('hidden'); // Muestra el modal
        searchInput.focus(); // Pone el foco en el input para que el usuario pueda escribir
        searchResultsContainer.innerHTML = ''; // Limpia resultados de búsquedas anteriores
        noResultsMessage.classList.add('hidden'); // Oculta el mensaje de "no resultados"
        searchInput.value = ''; // Limpia el valor del input
    }

    function closeSearchModal() {
        searchModal.classList.add('hidden'); // Oculta el modal
        searchResultsContainer.innerHTML = ''; // Limpia los resultados al cerrar
        searchInput.value = ''; // Limpia el input
    }

    // =========================================================
    // LÓGICA DE BÚSQUEDA DE PRODUCTOS
    // =========================================================

    /**
     * Realiza una búsqueda de productos en el backend.
     * @param {string} query El término de búsqueda ingresado por el usuario.
     */
    async function performSearch(query) {
        // Si la búsqueda está vacía o solo son espacios, limpiar y salir
        if (query.trim() === '') {
            searchResultsContainer.innerHTML = '';
            noResultsMessage.classList.add('hidden');
            return;
        }

        try {
            // Realiza la petición a tu nueva ruta de búsqueda
            const response = await fetch(`/api/products/search?query=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Error al buscar productos. Código: ' + response.status);
            }
            const products = await response.json();
            renderSearchResults(products); // Renderiza los productos encontrados
        } catch (error) {
            console.error('Error en la búsqueda:', error);
            searchResultsContainer.innerHTML = '<p style="color: red; text-align: center;">Error al cargar los resultados de búsqueda. Intente de nuevo.</p>';
            noResultsMessage.classList.add('hidden');
        }
    }

    /**
     * Renderiza los productos encontrados en el contenedor de resultados.
     * @param {Array} products Array de objetos producto.
     */
    function renderSearchResults(products) {
        searchResultsContainer.innerHTML = ''; // Limpiar resultados anteriores
        if (products.length === 0) {
            noResultsMessage.classList.remove('hidden'); // Muestra el mensaje si no hay resultados
        } else {
            noResultsMessage.classList.add('hidden'); // Oculta el mensaje si hay resultados
            products.forEach(product => {
                const productCardHtml = createSearchResultCardHTML(product);
                searchResultsContainer.innerHTML += productCardHtml; // Añade el HTML de la tarjeta
            });
        }
    }

    /**
     * Crea el HTML para una tarjeta de producto en los resultados de búsqueda.
     * @param {Object} product El objeto producto con sus detalles.
     * @returns {string} El string HTML de la tarjeta del producto.
     */
    function createSearchResultCardHTML(product) {
        const formattedPrice = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(product.price);
        // La image_url ya viene como URL absoluta de GCS, la usamos directamente
        const imageUrl = product.image_url; 

        return `
            <div class="search-result-item"
                 data-id="${product.id}"
                 data-name="${product.name}"
                 data-price="${product.price}"
                 data-image="${imageUrl}"> <img src="${imageUrl}" alt="${product.name}">
                <div class="search-result-details">
                    <h3>${product.name}</h3>
                    <p class="description">${product.description}</p>
                    <p class="price">${formattedPrice}</p>
                </div>
                <button class="add-to-cart-btn">Agregar al carrito</button>
            </div>
        `;
    }

    // =========================================================
    // EVENT LISTENERS
    // =========================================================

    // 1. Abrir el modal de búsqueda al hacer clic en el ícono
    if (searchIconBtn) { // Asegurarse de que el elemento existe
        searchIconBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Evita que la página salte si el href es "#"
            openSearchModal();
        });
    }

    // 2. Cerrar el modal de búsqueda al hacer clic en el botón de cerrar
    if (closeSearchModalBtn) { // Asegurarse de que el elemento existe
        closeSearchModalBtn.addEventListener('click', closeSearchModal);
    }

    // 3. Cerrar el modal al hacer clic en el overlay (fuera del contenido del modal)
    searchModal.addEventListener('click', (event) => {
        if (event.target === searchModal) { // Solo si el clic es directamente en el overlay
            closeSearchModal();
        }
    });

    // 4. Búsqueda en tiempo real (con "debounce" para no saturar el servidor)
    searchInput.addEventListener('input', (event) => {
        clearTimeout(searchTimeout); // Limpia el temporizador anterior
        searchTimeout = setTimeout(() => {
            performSearch(event.target.value); // Ejecuta la búsqueda después del retraso
        }, SEARCH_DELAY);
    });

    // 5. Delegación de eventos para los botones "Agregar al carrito" dentro de los resultados de búsqueda
    // Usamos delegación porque los resultados se añaden dinámicamente al DOM
    searchResultsContainer.addEventListener('click', (event) => {
        const addToCartBtn = event.target.closest('.add-to-cart-btn'); // Busca el botón "Agregar al carrito"
        
        if (addToCartBtn) { // Si se hizo clic en un botón "Agregar al carrito"
            const productItem = addToCartBtn.closest('.search-result-item'); // Obtiene la tarjeta del producto padre
            if (productItem) {
                // Extrae la información del producto de los atributos data-
                const product = {
                    id: parseInt(productItem.dataset.id),
                    name: productItem.dataset.name,
                    price: parseFloat(productItem.dataset.price),
                    image_url: productItem.dataset.image, // Usar image_url para consistencia con el carrito
                    quantity: 1
                };
                
                // Llama a las funciones globales addToCart y updateCartIconBadge
                // (asumiendo que estas funciones están definidas en llamadoCarpetas.js o common.js y son globales)
                if (typeof addToCart === 'function' && typeof updateCartIconBadge === 'function') {
                    addToCart(product);
                    updateCartIconBadge();
                    // Opcional: Podrías cerrar el modal después de añadir al carrito
                    // closeSearchModal(); 
                } else {
                    console.error('Error: Las funciones `addToCart` o `updateCartIconBadge` no están disponibles globalmente.');
                    alert('No se pudo añadir el producto al carrito. Revise la consola.');
                }
            }
        }
    });
});