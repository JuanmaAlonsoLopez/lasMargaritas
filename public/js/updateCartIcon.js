// public/js/updateCartIcon.js

// Función para actualizar el contador del carrito en el icono (GLOBAL)
function updateCartIconBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    let totalQuantity = 0;
    cart.forEach(product => {
        totalQuantity += product.quantity;
    });

    const cartIconCountElement = document.getElementById('cart-item-count'); // Obtener el elemento aquí
    if (cartIconCountElement) {
        cartIconCountElement.textContent = totalQuantity;
        // Muestra u oculta el badge según si hay productos
        cartIconCountElement.style.display = totalQuantity > 0 ? 'block' : 'none'; 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Llamar a la función al cargar el DOM para establecer el conteo inicial
    updateCartIconBadge();

    // Escuchar el evento 'cartUpdated' despachado por addToCart para actualizar el badge
    window.addEventListener('cartUpdated', updateCartIconBadge);
});