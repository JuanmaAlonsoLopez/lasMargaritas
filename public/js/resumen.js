// Reemplaza esto con tu Public Key REAL de Mercado Pago
const publicKey = 'TU_PUBLIC_KEY'; 
const mp = new MercadoPago(publicKey);

// 1. Función para leer los datos del carrito desde la tabla HTML
function obtenerProductosDelCarrito() {
    const productos = [];
    const filas = document.querySelectorAll('#tabla-carrito tbody tr');

    filas.forEach(fila => {
        const nombre = fila.querySelector('.nombre').innerText;
        const cantidad = parseInt(fila.querySelector('.cantidad').innerText, 10);
        const precio = parseFloat(fila.querySelector('.precio').innerText);

        if (nombre && !isNaN(cantidad) && !isNaN(precio)) {
            productos.push({
                nombre: nombre,
                cantidad: cantidad,
                precio: precio,
            });
        }
    });

    return productos;
}

// 2. Event listener para el botón de "Pagar ahora"
document.getElementById('boton-pagar').addEventListener('click', async () => {
    const productos = obtenerProductosDelCarrito();

    if (productos.length === 0) {
        alert('El carrito está vacío.');
        return;
    }

    try {
        // 3. Enviar los productos al backend para crear la preferencia
        const response = await fetch('http://localhost:3000/crear-preferencia', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productos: productos }),
        });

        const preference = await response.json();

        if (preference.id) {
            // 4. Si todo salió bien, renderizamos el botón de pago
            renderizarBotonDePago(preference.id);
            // Opcional: Ocultamos el botón original de "Pagar"
            document.getElementById('boton-pagar').style.display = 'none';
        } else {
            throw new Error('No se pudo obtener el ID de la preferencia.');
        }

    } catch (error) {
        console.error(error);
        alert('Error al procesar el pago. Inténtalo de nuevo.');
    }
});

// 5. Función para renderizar el botón de Checkout Pro
function renderizarBotonDePago(preferenceId) {
    mp.bricks().create('wallet', 'wallet_container', {
        initialization: {
            preferenceId: preferenceId,
        },
        customization: {
            texts: {
                valueProp: 'smart_option',
            },
        },
    });
}