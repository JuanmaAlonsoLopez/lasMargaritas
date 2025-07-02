// public/js/searchBar.js

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM
    const searchIconBtn = document.getElementById('search-icon-btn'); 
    const searchModal = document.getElementById('search-modal');       
    const closeSearchModalBtn = document.getElementById('close-search-modal'); 
    const searchInput = document.getElementById('search-input');       
    const searchResultsContainer = document.getElementById('search-results-container'); 
    const noResultsMessage = document.getElementById('no-results-message'); 

    let searchTimeout; 
    const SEARCH_DELAY = 300; 

    // =========================================================
    // FUNCIONES PARA CONTROLAR EL MODAL
    // =========================================================

    function openSearchModal() {
        searchModal.classList.remove('hidden'); 
        searchInput.focus(); 
        searchResultsContainer.innerHTML = ''; 
        noResultsMessage.classList.add('hidden'); 
        searchInput.value = ''; 
    }

    function closeSearchModal() {
        searchModal.classList.add('hidden'); 
        searchResultsContainer.innerHTML = ''; 
        searchInput.value = ''; 
    }

    // =========================================================
    // LÓGICA DE BÚSQUEDA DE PRODUCTOS
    // =========================================================

    async function performSearch(query) {
        if (query.trim() === '') {
            searchResultsContainer.innerHTML = '';
            noResultsMessage.classList.add('hidden');
            return;
        }

        try {
            const response = await fetch(`/api/products/search?query=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Error al buscar productos. Código: ' + response.status);
            }
            const products = await response.json();
            renderSearchResults(products); 
        } catch (error) {
            console.error('Error en la búsqueda:', error);
            searchResultsContainer.innerHTML = '<p style="color: red; text-align: center;">Error al cargar los resultados de búsqueda. Intente de nuevo.</p>';
            noResultsMessage.classList.add('hidden');
        }
    }

    function renderSearchResults(products) {
        searchResultsContainer.innerHTML = ''; 
        if (products.length === 0) {
            noResultsMessage.classList.remove('hidden'); 
        } else {
            noResultsMessage.classList.add('hidden'); 
            products.forEach(product => {
                const productCardHtml = createSearchResultCardHTML(product);
                searchResultsContainer.innerHTML += productCardHtml; 
            });
        }
    }

    function createSearchResultCardHTML(product) {
        const formattedPrice = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(product.price);
        const imageUrl = product.image_url; 

        return `
            <div class="search-result-item"
                 data-id="${product.id}"
                 data-name="${product.name}"
                 data-price="${product.price}"
                 data-image="${imageUrl}">
                <img src="${imageUrl}" alt="${product.name}">
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

    // Abrir el modal de búsqueda
    if (searchIconBtn) { 
        searchIconBtn.addEventListener('click', (event) => {
            event.preventDefault(); 
            openSearchModal();
        });
    }

    // Cerrar el modal de búsqueda
    if (closeSearchModalBtn) { 
        closeSearchModalBtn.addEventListener('click', closeSearchModal);
    }

    // Cerrar el modal al hacer clic en el overlay
    searchModal.addEventListener('click', (event) => {
        if (event.target === searchModal) { 
            closeSearchModal();
        }
    });

    // Búsqueda en tiempo real (con "debounce")
    searchInput.addEventListener('input', (event) => {
        clearTimeout(searchTimeout); 
        searchTimeout = setTimeout(() => {
            performSearch(event.target.value); 
        }, SEARCH_DELAY);
    });

    // Delegación de eventos para los botones "Agregar al carrito"
    searchResultsContainer.addEventListener('click', (event) => {
        const addToCartBtn = event.target.closest('.add-to-cart-btn'); 
        
        if (addToCartBtn) { 
            const productItem = addToCartBtn.closest('.search-result-item'); 
            if (productItem) {
                const product = {
                    id: parseInt(productItem.dataset.id),
                    name: productItem.dataset.name,
                    price: parseFloat(productItem.dataset.price),
                    image: productItem.dataset.image, // Cambiado a 'image' para coincidir con `addToCart`
                    quantity: 1
                };
                
                // Llama a las funciones globales addToCart y updateCartIconBadge
                if (typeof addToCart === 'function') { // Solo verificamos addToCart
                    addToCart(product);
                    // updateCartIconBadge se actualizará automáticamente por el evento 'cartUpdated'
                    // closeSearchModal(); // Opcional
                } else {
                    console.error('Error: La función `addToCart` no está disponible globalmente.');
                    alert('No se pudo añadir el producto al carrito. Revise la consola.');
                }
            }
        }
    });
});