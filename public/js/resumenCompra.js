document.addEventListener('DOMContentLoaded', () => {
    const cartContainer = document.getElementById('cart-products-container');
    const subtotalElem = document.getElementById('product-subtotal');
    const totalElem = document.getElementById('total-amount');
    const shippingCost = 1500;
    const getCart = () => JSON.parse(localStorage.getItem('cart')) || []; // Asegúrate de que esta esté vinculada a la global si es necesario

    async function fetchProductDetails(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            if (!response.ok) {
                console.error(`Error al obtener detalles del producto ${productId}:`, response.statusText);
                return null;
            }
            const productDetails = await response.json();
            return productDetails;
        } catch (error) {
            console.error(`Error de red o servidor al obtener producto ${productId}:`, error);
            return null;
        }
    }

    async function renderCart() {
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

        // Obtener detalles completos para cada producto del carrito
        const productDetailsPromises = cart.map(product => fetchProductDetails(product.id));
        const detailedProducts = await Promise.all(productDetailsPromises);

        cart.forEach((product, index) => {
            const fetchedProduct = detailedProducts[index];
            const imageUrl = fetchedProduct ? fetchedProduct.image_url : product.image_url;

            const productTotal = product.price * product.quantity;
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
            } else if (action === 'decrease' && productInCart.quantity > 1) {
                productInCart.quantity--;
            }
            window.dispatchEvent(new Event('cartUpdated')); // Disparar evento para actualizar el badge globalmente
        } else if (target.classList.contains('remove-item')) {
            cart = cart.filter(p => p.id !== productId);
            window.dispatchEvent(new Event('cartUpdated')); // Disparar evento para actualizar el badge globalmente
        }
        
        saveCart(cart);
        renderCart(); // Vuelve a renderizar el carrito
    });

    // === SECCIÓN DE PAGO CON MERCADO PAGO ===
    const checkoutButton = document.getElementById('btn-pagar');
    
    const publicKey = 'TEST-5a6b315b-a5f0-4396-9625-8b6142c2ba69'; 
    const mercadopago = new MercadoPago(publicKey, { locale: 'es-AR' });

    checkoutButton.addEventListener('click', async () => {
        // Verificar si la sesión está iniciada antes de proceder
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token'); // Asumiendo que el token es un indicador de sesión

        if (!user || !token || !user.id) {
            alert('Debes iniciar sesión para continuar la compra.');
            return;
        }

        const cart = getCart(); 
        if (cart.length === 0) {
            alert('El carrito está vacío.');
            return;
        }
        
        checkoutButton.disabled = true;

        try {
            // Calcula el total del carrito para enviarlo
            const totalAmount = parseFloat(totalElem.textContent.replace('Total: $', '').replace(',', ''));
            
            // Envía el carrito y el ID del usuario al backend
            const response = await fetch('/api/pagos/crear-preferencia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    carrito: cart, 
                    userId: user.id, // Envía el ID del usuario
                    total: totalAmount // Envía el total calculado
                }), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error del servidor');
            }

            const preference = await response.json();

            if (preference.id) {
                // Redirigir a la página de envío con el status (y opcionalmente el orderId si lo necesitas para shipment.html)
                // Usamos la URL de retorno que Mercado Pago nos dará en el backend.
                // Aquí podrías guardar el orderId en localStorage si lo necesitas en shipment.html
                // localStorage.setItem('lastOrderId', preference.orderId); // Si el backend te devuelve un orderId

                // Mercado Pago ya maneja la redirección a las back_urls que definimos en el backend.
                // Aquí solo necesitamos hacer el render del botón de MP.
                checkoutButton.classList.add('hidden');
                createCheckoutButton(preference.id); // Esto renderiza el botón de MP
                // Si quieres ir a shipment.html *después* del pago de MP, MP se encargará de la redirección
                // a las URLs definidas en tu backend (success, failure, pending).
                // Esas URLs de retorno (back_urls) ya apuntan a shipment.html?status=...
                // Por lo tanto, no necesitas una redirección directa aquí.
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

    // Asegurarse de que getCart y updateCartIconBadge sean globales si se llaman en otros lugares.
    // getCart ya está definido localmente. updateCartIconBadge se llamará mediante el evento.
    
    // Iniciar el renderizado del carrito al cargar la página
    renderCart();
});