const express = require('express');
const mercadopago = require('mercadopago');
const app = express();
const bodyParser = require('body-parser');

// Configura tu token de acceso
mercadopago.configure({
    access_token: 'APP_USR-6151982492022519-060920-ed5fdd184d492b16a07375d5b26f668c-1316664670',
});

// Middleware para parsear el cuerpo de las solicitudes JSON
app.use(bodyParser.json());

// Agrega un middleware de log para todas las solicitudes POST
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST') {
        console.log('Request body:', JSON.stringify(req.body, null, 2)); // Muestra el cuerpo de la solicitud JSON
    }
    next();
});

// Ruta para crear la preferencia
app.post('/create_preference', async (req, res) => {
    const clientCartItems = req.body.items; // Estos ítems solo contienen el ID y la cantidad del cliente

    console.log('Received items from client:', clientCartItems); // Log para ver los ítems recibidos

    if (!clientCartItems || clientCartItems.length === 0) {
        console.error('Error: El carrito está vacío o no se enviaron ítems.');
        return res.status(400).json({ message: 'El carrito está vacío o no se enviaron ítems.' });
    }

    const itemsForMercadoPago = [];
    let totalAmount = 0;

    try {
        // Validación y obtención de datos de la DB
        // Para esta prueba, vamos a simular los productos, pero DEBES reemplazarlos
        // con la lógica de tu base de datos en un entorno real.
        const mockProductsDB = {
            1: { id: 1, title: 'Almohadón Ortopédico Deluxe - 70x50 cm', price: 9290, stock: 50, image: '../images/fotosProductos/Margarita-Photoroom.png' },
            2: { id: 2, title: 'Cojín Lumbar Ergonómico', price: 3500, stock: 20, image: 'https://via.placeholder.com/100/FF0000/FFFFFF?text=Cojin' },
            3: { id: 3, title: 'Funda de Almohada de Algodón Premium', price: 1200, stock: 30, image: 'https://via.placeholder.com/100/0000FF/FFFFFF?text=Funda' }
        };

        for (const clientItem of clientCartItems) {
            const productFromDB = mockProductsDB[clientItem.id];

            if (!productFromDB) {
                console.error(`Error: Producto con ID ${clientItem.id} no encontrado en la base de datos simulada.`);
                return res.status(404).json({ message: `Producto con ID ${clientItem.id} no encontrado.` });
            }
            if (productFromDB.stock < clientItem.quantity) {
                console.error(`Error: No hay suficiente stock para ${productFromDB.title}. Solicitado: ${clientItem.quantity}, Disponible: ${productFromDB.stock}`);
                return res.status(400).json({ message: `No hay suficiente stock para ${productFromDB.title}.` });
            }

            itemsForMercadoPago.push({
                title: productFromDB.title,
                quantity: clientItem.quantity,
                unit_price: productFromDB.price,
                currency_id: 'ARS'
            });
            totalAmount += productFromDB.price * clientItem.quantity;
        }

        console.log('Items prepared for Mercado Pago:', itemsForMercadoPago);

        const preferenceBody = {
            items: itemsForMercadoPago,
            back_urls: {
                success: 'http://localhost:3000/success',
                failure: 'http://localhost:3000/failure',
                pending: 'http://localhost:3000/pending',
            },
            auto_return: 'approved',
            // notifications_url: 'https://tu-dominio.com/webhook-mercadopago',
            external_reference: 'YOUR_ORDER_ID_FROM_DATABASE' // Si ya creaste el pedido en tu DB
        };

        const response = await mercadopago.preferences.create(preferenceBody);
        console.log('Mercado Pago preference created:', response.body.init_point);
        res.json({ init_point: response.body.init_point });

    } catch (error) {
        console.error('Error in /create_preference route:', error);
        // Asegúrate de que cualquier error sea enviado como JSON
        res.status(500).json({ message: 'Error al crear la preferencia de pago en el servidor.', error: error.message });
    }
});

// Rutas de redirección para back_urls
app.get('/success', (req, res) => {
    res.send('<h1>¡Pago exitoso! Gracias por tu compra.</h1>');
});

app.get('/failure', (req, res) => {
    res.send('<h1>El pago falló. Por favor, intenta de nuevo.</h1>');
});

app.get('/pending', (req, res) => {
    res.send('<h1>Tu pago está pendiente de aprobación. Te notificaremos cuando se complete.</h1>');
});

// Iniciar servidor
app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});