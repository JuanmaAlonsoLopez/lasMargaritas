// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES Y SELECTORES ---
    const API_BASE_URL = 'http://localhost:3000';

    // Seleccionamos los contenedores de productos que ya existen en el HTML
    const destacadosContainer = document.querySelector('#carousel1 .productos');
    const confortContainer = document.querySelector('#carousel2 .productos');
    const babyContainer = document.querySelector('#carousel3 .productos');
    const ortopedicaContainer = document.querySelector('#carousel4 .productos');
    
    /**
     * Crea el HTML para una sola tarjeta de producto.
     */
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

    /**
     * Busca productos y los muestra en el contenedor especificado.
     */
    async function fetchAndRenderProducts(container, category = null) {
        if (!container) {
            console.warn(`Contenedor no encontrado para: ${category || 'destacados'}`);
            return;
        }
        container.innerHTML = '<p>Cargando...</p>';

        try {
            let url = `${API_BASE_URL}/api/products`;
            if (category) {
                url += `?category=${encodeURIComponent(category)}`;
            }
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const products = await response.json();

            if (products.length > 0) {
                container.innerHTML = products.map(createProductCardHTML).join('');
            } else {
                container.innerHTML = '<p>No hay productos en esta categoría.</p>';
            }
        } catch (error) {
            console.error(`Error al cargar productos para "${category || 'destacados'}":`, error);
            container.innerHTML = '<p>Error al cargar productos.</p>';
        }
    }

    /**
     * Añade un producto al carrito en localStorage.
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
    }

    /**
     * Función principal que se ejecuta al cargar la página.
     */
    function initializePage() {
        // Llenamos cada carrusel con los productos de su categoría
        fetchAndRenderProducts(destacadosContainer, null); // "null" trae todos los productos
        fetchAndRenderProducts(confortContainer, 'Confort');
        fetchAndRenderProducts(babyContainer, 'Baby');
        fetchAndRenderProducts(ortopedicaContainer, 'Ortopédica');
    }

    // Listener global para los botones "Agregar al carrito"
    document.body.addEventListener('click', (event) => {
        if (event.target.classList.contains('agregar-carrito')) {
            const productCard = event.target.closest('.producto');
            if (productCard) {
                const product = {
                    id: parseInt(productCard.dataset.id),
                    name: productCard.dataset.name,
                    price: parseFloat(productCard.dataset.price),
                    image: productCard.dataset.image,
                    quantity: 1
                };
                addToCart(product);
            }
        }
    });

    // Inicia la carga de todos los productos en sus respectivos carruseles
    initializePage();
});