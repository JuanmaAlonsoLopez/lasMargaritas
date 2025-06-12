document.addEventListener('DOMContentLoaded', () => {

    // Función para crear la tarjeta HTML de un producto
    function crearTarjetaProducto(producto) {
        // Formatear el precio a moneda local (Argentina)
        const precioFormateado = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(producto.price);

        return `
            <div class="producto">
                <img src="../${producto.image_url}" alt="${producto.name}">
                <p>${producto.name}</p>
                <span>${precioFormateado}</span>
                <div class="cuotas">3 cuotas sin interés</div>
                <button class="agregar-carrito" data-id="${producto.id}">Agregar al carrito</button>
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
            // Hacemos la petición a tu API backend (ahora el backend la filtrará)
            const response = await fetch(`http://localhost:3000/api/products?category=${encodeURIComponent(categoriaNombre)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const productos = await response.json();

            contenedorProductos.innerHTML = '';
            // CORRECCIÓN: Usamos > 0 para manejar correctamente el caso de 0 productos
            if (productos.length > 0) {
                productos.forEach(producto => {
                    contenedorProductos.innerHTML += crearTarjetaProducto(producto);
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