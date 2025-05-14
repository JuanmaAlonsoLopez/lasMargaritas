// Datos de los productos en el carrito
const cartItems = [
    { id: 1, name: 'Almohadón Ortopédico Deluxe - 70x50 cm', price: 12000, imageUrl: '../images/prod_almohadon1.png' },
    { id: 2, name: 'Almohadón Memory Foam - 60x40 cm', price: 8500, imageUrl: '../images/prod_almohadon2.png' }
];

// Función para actualizar el carrito
function updateCart() {
    const cartContainer = document.getElementById('cart-items');
    cartContainer.innerHTML = ''; // Limpiar el carrito actual

    cartItems.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');
        
        //<img src="${item.imageUrl}" alt="${item.name}">
        cartItem.innerHTML = `

            <img src="https://imagedelivery.net/7yveHullsFjmXtPLdJPFsg/1553f2f9-dff7-42d5-7520-ea1173387b00/fit=cover" alt="">

            <span class="producto-nombre">${item.name}</span>
            <span class="producto-precio">$${item.price}</span>
            <button class="eliminar" onclick="removeItem(${item.id})">Eliminar</button>
        `;
        
        cartContainer.appendChild(cartItem);
    });
}

// Función para eliminar un producto del carrito
function removeItem(id) {
    const index = cartItems.findIndex(item => item.id === id);
    if (index !== -1) {
        cartItems.splice(index, 1); // Eliminar el producto
        updateCart(); // Actualizar el carrito
    }
}

// Mostrar el carrito al hacer clic en el icono
const cartIcon = document.getElementById('cart-icon');
cartIcon.addEventListener('click', () => {
    const cartDropdown = document.querySelector('.cart-dropdown');
    // Alternar entre mostrar y ocultar el carrito
    if (cartDropdown.style.display === 'none' || cartDropdown.style.display === '') {
        cartDropdown.style.display = 'block';
    } else {
        cartDropdown.style.display = 'none';
    }
});

// Inicializar el carrito
updateCart();
