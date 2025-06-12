// js/llamadoCarpetas.js

document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES Y SELECTORES ---
    const API_BASE_URL = 'http://localhost:3000';

    // Selectores para los carruseles de productos
    const destacadosContainer = document.querySelector('#carousel1 .productos');
    const confortContainer = document.querySelector('#carousel2 .productos');
    const babyContainer = document.querySelector('#carousel3 .productos');
    const ortopedicaContainer = document.querySelector('#carousel4 .productos');

    // Selector para el contenedor de items en el menú desplegable
    const cartItemsContainer = document.getElementById('cartItems');
    
    // --- LÓGICA DE PRODUCTOS ---
    function createProductCardHTML(product) {
        const formattedPrice = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(product.price);
        const imageUrl = product.image_url.startsWith('/') ? product.image_url : `/${product.image_url}`;
        return `
            <div class="producto" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-image="${imageUrl}">
                <img src="${imageUrl}" alt="Imagen de ${product.name}">
                <h3>${product.name}</h3>
                <p class="precio">${formattedPrice}</p>
                <button class="agregar-carrito">Agregar al carrito</button>
            </div>
        `;
    }

    async function fetchAndRenderProducts(container, category = null) {
        if (!container) return;
        container.innerHTML = '<p>Cargando...</p>';
        try {
            let url = `${API_BASE_URL}/api/products`;
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

    // --- LÓGICA DEL CARRITO ---
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
        
        // Actualizamos el contenido del carrito desplegable CADA VEZ que se añade algo
        updateCartDropdown();
    }
    
    function updateCartDropdown() {
        // Asegurarnos de que el contenedor exista antes de intentar usarlo
        if (!cartItemsContainer) return;

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

    // --- INICIALIZACIÓN Y EVENTOS ---
    function initializePage() {
        // Carga de productos en carruseles
        fetchAndRenderProducts(destacadosContainer, null);
        fetchAndRenderProducts(confortContainer, 'Confort');
        fetchAndRenderProducts(babyContainer, 'Baby');
        fetchAndRenderProducts(ortopedicaContainer, 'Ortopédica');
        
        // Actualiza el carrito desplegable al cargar la página por si ya había items
        updateCartDropdown();
    }

    // Listener para los botones "Agregar al carrito"
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
            }
        }
    });
    
    // Inicia todo el proceso
    initializePage();
});