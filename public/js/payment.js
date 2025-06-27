document.addEventListener('DOMContentLoaded', () => {
    // Tu Public Key de Mercado Pago
    const publicKey = 'TEST-5a6b315b-a5f0-4396-9625-8b6142c2ba69';
    const mercadopago = new MercadoPago(publicKey, {
        locale: 'es-AR' // O la localidad que corresponda
    });

    const btnPagar = document.getElementById('btn-pagar');
    
    if (btnPagar) {
        btnPagar.addEventListener('click', async () => {
            // 1. Obtener el carrito de localStorage
            const carrito = JSON.parse(localStorage.getItem('cart')) || [];

            if (carrito.length === 0) {
                Swal.fire("Tu carrito está vacío", "Agrega productos antes de pagar", "warning");
                return;
            }
            
            // Deshabilita el botón para evitar múltiples clics
            btnPagar.disabled = true;

            try {
                // 2. Enviar el carrito al backend para crear la preferencia de pago
                const response = await fetch('/pago/crear-orden', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ carrito: carrito }), // El backend espera un objeto { carrito: [...] }
                });

                const preference = await response.json();

                if (preference.id) {
                    // 3. Si todo sale bien, renderizar el botón de Mercado Pago
                    createCheckoutButton(preference.id);
                    // Ocultar el botón original de "COMPRAR"
                    btnPagar.style.display = 'none';
                } else {
                    Swal.fire("¡Ups!", "No se pudo generar el link de pago. Intenta de nuevo.", "error");
                    btnPagar.disabled = false;
                }

            } catch (error) {
                console.error('Error:', error);
                Swal.fire("Error", "Ocurrió un error al procesar tu solicitud. Revisa la consola para más detalles.", "error");
                btnPagar.disabled = false;
            }
        });
    }

    // Función que crea e inicializa el checkout
    function createCheckoutButton(preferenceId) {
        mercadopago.checkout({
            preference: {
                id: preferenceId
            },
            render: {
                container: '.checkout-btn', // Clase CSS del contenedor donde se renderizará el botón
                label: 'Pagar ahora', // Texto del botón
            }
        });
    }
});