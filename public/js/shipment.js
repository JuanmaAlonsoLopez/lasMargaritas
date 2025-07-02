// public/js/shipment.js

document.addEventListener('DOMContentLoaded', async () => {
    const shipmentForm = document.getElementById('shipment-form');
    const statusMessageDiv = document.getElementById('payment-status-message');
    const confirmShipmentBtn = document.getElementById('confirm-shipment-btn');

    // 1. Mostrar mensaje de estado de pago de Mercado Pago
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('status');

    if (paymentStatus && statusMessageDiv) {
        statusMessageDiv.style.display = 'block';
        if (paymentStatus === 'success') {
            statusMessageDiv.textContent = '¡Pago Exitoso! Por favor, completa tus datos para el envío.';
            statusMessageDiv.classList.add('success');
            // Aquí podríamos vaciar el localStorage del carrito si el pago fue exitoso
            localStorage.removeItem('cart'); 
            window.dispatchEvent(new Event('cartUpdated')); // Para actualizar el icono del carrito
        } else if (paymentStatus === 'pending') {
            statusMessageDiv.textContent = 'Tu pago está pendiente. Completa tus datos de envío.';
            statusMessageDiv.classList.add('pending');
        } else if (paymentStatus === 'failure') {
            statusMessageDiv.textContent = 'Hubo un problema con tu pago. Por favor, intenta de nuevo.';
            statusMessageDiv.classList.add('failure');
        }
    }

    // 2. Verificar sesión del usuario y precargar datos
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!user || !token || !user.id) {
        alert('Debes iniciar sesión para acceder a esta página o finalizar tu compra.');
        window.location.href = '/login.html'; // Redirigir al login si no está autenticado
        return;
    }

    // Precargar datos del usuario si están disponibles
    document.getElementById('fullName').value = user.name || '';
    document.getElementById('email').value = user.email || '';

    // 3. Manejar el envío del formulario
    if (shipmentForm) {
        shipmentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            confirmShipmentBtn.disabled = true;

            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            if (cart.length === 0) {
                alert('Tu carrito está vacío. No se puede crear un pedido.');
                confirmShipmentBtn.disabled = false;
                window.location.href = '/index.html'; // O redirigir al carrito
                return;
            }

            // Obtener el total de la compra (necesitarás el total final del carrito)
            // Si tu ResumenCompra.js ya calcula el total, podrías pasarlo en localStorage o buscarlo de nuevo
            // Para simplicidad, podríamos recalcularlo o buscar el total del pedido en la API si fuera necesario.
            // Por ahora, asumiremos que los 'items' en el carrito de localStorage ya tienen 'price'.
            const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 1500; // Sumar costo de envío

            const shipmentData = {
                userId: user.id,
                total: totalAmount,
                fullName: document.getElementById('fullName').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                province: document.getElementById('province').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                cartItems: cart // Envía los ítems del carrito para guardar en el pedido
            };

            try {
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Enviar token de autenticación
                    },
                    body: JSON.stringify(shipmentData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error al guardar el pedido.');
                }

                alert('¡Pedido realizado con éxito! Gracias por tu compra.');
                localStorage.removeItem('cart'); // Vaciar el carrito de localStorage
                window.dispatchEvent(new Event('cartUpdated')); // Actualizar el icono del carrito
                window.location.href = '/pages/success.html'; // Redirigir a una página de confirmación final
            } catch (error) {
                console.error('Error al confirmar el envío y crear el pedido:', error);
                alert(`Error: ${error.message}`);
                confirmShipmentBtn.disabled = false;
            }
        });
    }
});