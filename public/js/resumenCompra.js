document.addEventListener('DOMContentLoaded', () => {
    const cartContainer = document.getElementById('cart-products-container');
    const subtotalElem = document.getElementById('product-subtotal');
    const totalElem = document.getElementById('total-amount');
    const shippingCost = 1500;
    const getCart = () => JSON.parse(localStorage.getItem('cart')) || [];
    
    // Función para obtener los detalles completos de un producto desde la API
    // Esto es lo nuevo que usaremos para obtener la imagen por ID
    async function fetchProductDetails(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            if (!response.ok) {
                console.error(`Error al obtener detalles del producto ${productId}:`, response.statusText);
                return null; // Devuelve null si no se puede obtener el producto
            }
            const productDetails = await response.json();
            return productDetails;
        } catch (error) {
            console.error(`Error de red o servidor al obtener producto ${productId}:`, error);
            return null;
        }
    }

    async function renderCart() { // <--- Ahora es async
        const cart = getCart();
        if (!cartContainer) return;

        if (cart.length === 0) {
            cartContainer.innerHTML = '<p>Tu carrito de compras está vacío.</p>';
            subtotalElem.textContent = 'Productos: $0.00';
            totalElem.textContent = `Total: $${shippingCost.toFixed(2)}`;
            document.getElementById('btn-pagar').disabled = true;
            return;
        }

        let subtotal = 0;
        let productsHtml = [];

        // Hacemos una solicitud para cada producto en el carrito
        // Esto garantiza que siempre obtenemos la URL de imagen más actual de la BD
        const productDetailsPromises = cart.map(product => fetchProductDetails(product.id));
        const detailedProducts = await Promise.all(productDetailsPromises);

        cart.forEach((product, index) => {
            const fetchedProduct = detailedProducts[index];
            
            // Usamos la URL de la imagen obtenida por la API, si existe
            // Si por alguna razón la llamada falló, usamos la que ya tenemos en localStorage
            const imageUrl = fetchedProduct ? fetchedProduct.image_url : product.image_url;

            const productTotal = product.price * product.quantity; // Usamos el precio del carrito
            subtotal += productTotal;

            productsHtml.push(`
                <div class="cart-product-item" data-id="${product.id}">
                    <img src="${imageUrl}" alt="${product.name}" class="cart-product-image">
                    <div class="cart-product-details">
                        <p class="cart-product-title">${product.name}</p>
                        <div class="cart-product-quantity-controls">
                            <button class="quantity-change" data-action="decrease">-</button>
                            <span class="quantity-display">${product.quantity}</span>
                            <button class="quantity-change" data-action="increase">+</button>
                        </div>
                    </div>
                    <p class="cart-product-price">$${productTotal.toFixed(2)}</p>
                    <button class="remove-item">Eliminar</button>
                </div>
            `);
        });

        cartContainer.innerHTML = productsHtml.join('');
        
        subtotalElem.textContent = `Productos: $${subtotal.toFixed(2)}`;
        totalElem.textContent = `Total: $${(subtotal + shippingCost).toFixed(2)}`;
        document.getElementById('btn-pagar').disabled = false;
    }

    function saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    cartContainer.addEventListener('click', (event) => {
        let cart = getCart();
        const target = event.target;
        const productItem = target.closest('.cart-product-item');
        if (!productItem) return;

        const productId = parseInt(productItem.dataset.id);
        const productInCart = cart.find(p => p.id === productId);

        if (target.classList.contains('quantity-change')) {
            const action = target.dataset.action;
            if (action === 'increase') {
                productInCart.quantity++;
                window.updateCartIconBadge();
            } else if (action === 'decrease' && productInCart.quantity > 1) {
                productInCart.quantity--;
                window.updateCartIconBadge();
            }
        } else if (target.classList.contains('remove-item')) {
            cart = cart.filter(p => p.id !== productId);
            window.updateCartIconBadge();
        }
        
        saveCart(cart);
        // Volvemos a renderizar para actualizar la UI
        window.updateCartIconBadge();
        renderCart(); 
    });

    // === SECCIÓN DE PAGO CON MERCADO PAGO ===
    const checkoutButton = document.getElementById('btn-pagar');
    
    const publicKey = 'TEST-5a6b315b-a5f0-4396-9625-8b6142c2ba69'; 
    const mercadopago = new MercadoPago(publicKey, { locale: 'es-AR' });

    checkoutButton.addEventListener('click', async () => {
        const cart = getCart(); 
        if (cart.length === 0) {
            alert('El carrito está vacío.');
            return;
        }
        
        checkoutButton.disabled = true;

        try {
            const response = await fetch('/api/pagos/crear-preferencia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ carrito: cart }), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error del servidor');
            }

            const preference = await response.json();

            if (preference.id) {
                checkoutButton.classList.add('hidden');
                createCheckoutButton(preference.id);
            } else {
                throw new Error('No se recibió un ID de preferencia válido.');
            }
        } catch (err) {
            console.error('Error en el checkout:', err);
            alert(`No se pudo iniciar el proceso de pago: ${err.message}`);
            checkoutButton.disabled = false;
        }
    });

    function createCheckoutButton(preferenceId) {
        mercadopago.checkout({
            preference: { id: preferenceId },
            render: {
                container: '.checkout-btn',
                label: 'Pagar con Mercado Pago',
            }
        });
    }

    const cartIconCountElement = document.getElementById('cart-item-count');

    // Make getCart global if other scripts need direct access
    window.getCart = () => JSON.parse(localStorage.getItem('cart')) || [];

    // Make updateCartIconBadge global
    window.updateCartIconBadge = function() {
        const cart = window.getCart(); // Use the global getCart
        let totalQuantity = 0;
        cart.forEach(product => {
            totalQuantity += product.quantity;
        });

        if (cartIconCountElement) {
            cartIconCountElement.textContent = totalQuantity;
            if (totalQuantity > 0) {
                cartIconCountElement.style.display = 'block';
            } else {
                cartIconCountElement.style.display = 'none';
            }
        }
    };

    // Call the function on page load to set the initial count
    window.updateCartIconBadge();
    
    // Llama a la función de renderizado al cargar la página
    renderCart();
});