// public/js/llamadoCarpetas.js

// --- LÓGICA DEL CARRITO (FUNCIONES GLOBALES) ---
// Estas funciones son globales para que otros scripts (como searchBar.js) puedan llamarlas.

/**
 * Agrega un producto al carrito en localStorage.
 * @param {Object} productToAdd Objeto del producto a añadir (id, name, price, image, quantity).
 */
function addToCart(productToAdd) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingProduct = cart.find(item => item.id === productToAdd.id);
    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push(productToAdd);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    
    alert(`"${productToAdd.name}" fue agregado al carrito.`);
    
    // Al modificar el carrito, actualizamos el dropdown (si existe)
    updateCartDropdown(); 
    // Y disparamos un evento para que updateCartIcon.js se actualice
    window.dispatchEvent(new Event('cartUpdated')); 
}

/**
 * Actualiza el contenido del dropdown del carrito en la barra de navegación.
 * Esta función es llamada cuando el carrito es modificado.
 */
function updateCartDropdown() {
    // Asegúrate de que el elemento con ID 'cartItems' exista en tu HTML (normalmente en el navbar)
    const cartItemsContainer = document.getElementById('cartItems'); 
    if (!cartItemsContainer) return; // Si no existe el contenedor, no hace nada

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; color: #888;">El carrito está vacío.</p>';
    } else {
        cartItemsContainer.innerHTML = cart.map(product => `
            <div style="display: flex; align-items: center; margin-bottom: 10px; font-size: 14px;">
                <img src="${product.image}" alt="${product.name}" style="width: 40px; height: 40px; margin-right: 10px; border-radius: 4px;">
                <div style="flex-grow: 1;">
                    <div style="font-weight: bold; margin-bottom: 4px;">${product.name}</div>
                    <div>Cantidad: ${product.quantity}</div>
                </div>
            </div>
        `).join('');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES Y SELECTORES ---
    // Selectores para los carruseles de productos
    // Asegúrate de que los IDs #carousel1, #carousel2, etc. correspondan a tus contenedores reales
    // Si tus carruseles se inicializan por ID en carousel.js, podrías no necesitar estos selectores aquí
    const destacadosContainer = document.querySelector('#carousel1 .productos'); // Verifica si usas #carousel1
    const confortContainer = document.querySelector('#confort-carousel .productos'); // Usa los IDs de carousel.js
    const babyContainer = document.querySelector('#baby-carousel .productos');
    const ortopedicaContainer = document.querySelector('#ortopedica-carousel .productos');

    // La lógica de updateCartDropdown ahora es global, así que 'cartItemsContainer'
    // no se necesita declarar localmente aquí si solo se usa en updateCartDropdown.


    // --- LÓGICA DE PRODUCTOS PARA CARRUSELES (fetch y render) ---
    function createProductCardHTML(product) {
        const formattedPrice = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(product.price);
        const imageUrl = product.image_url; 
        return `
            <div class="producto" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-image="${imageUrl}">
                <img src="${imageUrl}" alt="Imagen de ${product.name}">
                <h3>${product.name}</h3>
                <p class="precio">${formattedPrice}</p>
                <button class="agregar-carrito">Agregar al carrito</button>
            </div>
        `;
    }

    /**
     * Fetches products from the API and renders them into a specified container.
     * @param {HTMLElement} container The DOM element to render products into.
     * @param {string|null} category Optional category name to filter products.
     */
    async function fetchAndRenderProducts(container, category = null) {
        if (!container) return; // Salir si el contenedor no existe
        container.innerHTML = '<p>Cargando...</p>';
        try {
            let url = `/api/products`; 
            if (category) { url += `?category=${encodeURIComponent(category)}`; }
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            
            const products = await response.json();
            container.innerHTML = products.length > 0 ? products.map(createProductCardHTML).join('') : '<p>No hay productos en esta categoría.</p>';
        } catch (error) {
            console.error('Error al cargar productos:', error);
            container.innerHTML = '<p>Error al cargar productos.</p>';
        }
    }

    // --- INICIALIZACIÓN DE LA PÁGINA Y EVENTOS ---
    function initializePage() {
        // Carga de productos en carruseles
        // Si no tienes #carousel1, #carousel2, etc. en index.html, remueve las líneas correspondientes
        if(destacadosContainer) fetchAndRenderProducts(destacadosContainer, null); // Si tienes sección de destacados general
        if(confortContainer) fetchAndRenderProducts(confortContainer, 'Confort');
        if(babyContainer) fetchAndRenderProducts(babyContainer, 'Baby');
        if(ortopedicaContainer) fetchAndRenderProducts(ortopedicaContainer, 'Ortopédica');
        
        // Actualiza el dropdown del carrito al cargar la página
        updateCartDropdown(); 
        // updateCartIconBadge se actualiza con su propio listener ahora (en updateCartIcon.js)
    }

    // Event listener delegado para los botones "Agregar al carrito"
    // Esto es robusto porque funciona para elementos creados dinámicamente
    document.body.addEventListener('click', (event) => {
        if (event.target.classList.contains('agregar-carrito')) {
            const productCard = event.target.closest('.producto');
            if (productCard) {
                // Extrae los datos del producto de los atributos data- del div.producto
                const product = {
                    id: parseInt(productCard.dataset.id),
                    name: productCard.dataset.name,
                    price: parseFloat(productCard.dataset.price),
                    image: productCard.dataset.image, // Usa 'image' para el nombre de la propiedad
                    quantity: 1
                };
                
                addToCart(product); // Llama a la función global addToCart
            }
        }
    });
    
    initializePage(); // Llama a la función de inicialización al cargar el DOM
});