document.addEventListener('DOMContentLoaded', () => {

    // Función para crear la tarjeta HTML de un producto
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

    // Función para cargar productos en una categoría específica
    async function cargarProductosPorCategoria(elementoCategoria) {
        const categoriaNombre = elementoCategoria.dataset.category;
        const contenedorProductos = elementoCategoria.querySelector('.productos');

        if (!contenedorProductos) return; // Si no encuentra el div, no hace nada.

        contenedorProductos.innerHTML = '<p>Cargando productos...</p>';

        try {
            // ✅ ¡CORRECCIÓN! Se usa una ruta relativa para que funcione en producción.
            const response = await fetch(`/api/products?category=${encodeURIComponent(categoriaNombre)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const productos = await response.json();

            contenedorProductos.innerHTML = '';
            if (productos.length > 0) {
                productos.forEach(producto => {
                    contenedorProductos.innerHTML += createProductCardHTML(producto);
                });
            } else {
                contenedorProductos.innerHTML = '<p>No hay productos en esta categoría.</p>';
            }
        } catch (error) {
            console.error('Error al cargar los productos:', error);
            contenedorProductos.innerHTML = '<p>No se pudieron cargar los productos. Intente más tarde.</p>';
        }
    }

    // Lógica para los carruseles
    function inicializarCarruseles() {
        const categorias = document.querySelectorAll('.categoria');

        categorias.forEach(categoria => {
            const contenedorProductos = categoria.querySelector('.productos');
            const prevButton = categoria.querySelector('.prev');
            const nextButton = categoria.querySelector('.next');
            
            if (!contenedorProductos || !prevButton || !nextButton) return;

            const cardWidth = 230; // Ancho de la tarjeta + gap

            nextButton.addEventListener('click', () => {
                contenedorProductos.scrollBy({ left: cardWidth, behavior: 'smooth' });
            });

            prevButton.addEventListener('click', () => {
                contenedorProductos.scrollBy({ left: -cardWidth, behavior: 'smooth' });
            });
        });
    }


    // --- INICIO DE EJECUCIÓN ---
    const todasLasCategorias = document.querySelectorAll('.categoria[data-category]');
    todasLasCategorias.forEach(cargarProductosPorCategoria);
    inicializarCarruseles();

});