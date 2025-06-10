const express = require('express');
const session = require('express-session');
const pool = require('./db'); // <-- DESCOMENTAR: Tu archivo de conexión a la base de datos
// const authRoutes = require('./routes/auth');
// const { googleCallback } = require('./controllers/authController');
// const passport = require('./utils/passport');
// const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const { MercadoPagoConfig, Preference } = require('mercadopago');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

app.use(cors({
  origin: 'http://127.0.0.1:5500', // Reemplaza con la URL de tu frontend
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST') {
        if (req.body && Object.keys(req.body).length > 0) {
            console.log('Request body:', JSON.stringify(req.body, null, 2));
        } else {
            console.log('Request body: (empty or not JSON)');
        }
    }
    next();
});

// --- TUS RUTAS DE AUTENTICACIÓN Y USUARIOS ---
// Descomenta estas secciones cuando las necesites activar,
// asegurándote de que los archivos 'db', 'routes/auth', 'controllers/authController', 'utils/passport' existen.
/*
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile','email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html' }),
  googleCallback
);

app.use('/api/auth', authRoutes);

app.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al consultar usuarios');
  }
});
*/
// --- FIN DE RUTAS DE AUTENTICACIÓN ---


// --- INICIO: RUTAS DE MERCADO PAGO ---

// Ruta para crear la preferencia de pago
app.post('/create_preference', async (req, res) => {
    const clientCartItems = req.body.items; // Estos ítems solo tienen id y quantity del frontend

    console.log('Received items from client for Mercado Pago:', clientCartItems);

    if (!clientCartItems || clientCartItems.length === 0) {
        console.error('Error: El carrito está vacío o no se enviaron ítems para Mercado Pago.');
        return res.status(400).json({ message: 'El carrito está vacío o no se enviaron ítems.' });
    }

    let itemsForMercadoPago = [];
    let orderTotal = 0; // Para calcular el total de la orden

    try {
        // --- COMIENZO: LÓGICA DE BASE DE DATOS REAL (PARA REEMPLAZAR EL HARDCODEO) ---
        // Aquí deberías tener una función que consulte tu tabla de productos (ej. 'public.products')
        // para obtener el título, precio y stock real de cada producto basado en su ID.
        // NO CONFÍES EN LOS PRECIOS/TÍTULOS QUE VIENEN DEL CLIENTE.

        // Ejemplo de consulta a la DB (descomenta y adapta cuando tengas tu tabla de productos):
        /*
        const productIds = clientCartItems.map(item => item.id);
        const productsQuery = `SELECT id, title, price, stock FROM public.products WHERE id = ANY($1)`;
        const dbProductsResult = await pool.query(productsQuery, [productIds]);
        const productsMap = new Map(dbProductsResult.rows.map(p => [p.id, p]));
        */

        // --- SIMULACIÓN DE PRODUCTOS DE LA BASE DE DATOS (PARA PRUEBAS HASTA QUE CONECTES LA DB) ---
        // Elimina o comenta este mockProductsDB cuando uses tu DB real de productos
        const mockProductsDB = {
            1: { id: 1, title: 'Almohadón Ortopédico Deluxe - 70x50 cm', price: 9290, stock: 50, image: '../images/fotosProductos/Margarita-Photoroom.png' },
            2: { id: 2, title: 'Cojín Lumbar Ergonómico', price: 3500, stock: 20, image: 'https://via.placeholder.com/100/FF0000/FFFFFF?text=Cojin' },
            3: { id: 3, title: 'Funda de Almohada de Algodón Premium', price: 1200, stock: 30, image: 'https://via.placeholder.com/100/0000FF/FFFFFF?text=Funda' }
        };
        // --- FIN DE SIMULACIÓN DE PRODUCTOS DE LA BASE DE DATOS ---


        for (const clientItem of clientCartItems) {
            // Reemplaza esta línea con la búsqueda real en 'productsMap' si usas la DB de productos:
            // const productFromDB = productsMap.get(clientItem.id);
            const productFromDB = mockProductsDB[clientItem.id]; // Mantengo la simulación por ahora

            if (!productFromDB) {
                console.error(`Error: Producto con ID ${clientItem.id} no encontrado en la base de datos.`);
                return res.status(404).json({ message: `Producto con ID ${clientItem.id} no encontrado.` });
            }
            if (productFromDB.stock < clientItem.quantity) {
                console.error(`Error: No hay suficiente stock para ${productFromDB.title}. Solicitado: ${clientItem.quantity}, Disponible: ${productFromDB.stock}`);
                return res.status(400).json({ message: `No hay suficiente stock para ${productFromDB.title}.` });
            }

            const itemPrice = productFromDB.price; // Precio validado desde tu DB
            const itemQuantity = clientItem.quantity; // Cantidad del carrito del cliente

            itemsForMercadoPago.push({
                id: productFromDB.id.toString(),
                title: productFromDB.title,
                quantity: itemQuantity,
                unit_price: itemPrice,
                currency_id: 'ARS'
            });
            orderTotal += itemPrice * itemQuantity; // Suma al total de la orden
        }

        console.log('Items prepared for Mercado Pago preference:', itemsForMercadoPago);
        console.log('Calculated Order Total:', orderTotal);

        // --- COMIENZO: CREAR LA ORDEN EN TU BASE DE DATOS ---
        // Aquí insertarás la orden en la tabla 'public.orders'
        let orderId;
        try {
            // Esto es un placeholder para los datos del usuario y la dirección.
            // En una aplicación real, los obtendrías del usuario logueado (req.user)
            // o de un formulario de checkout.
            const user_id = null; // Reemplaza con req.user.id si tienes autenticación
            const full_name = 'Comprador de Prueba';
            const address = 'Calle Falsa 123';
            const city = 'Mendoza';
            const province = 'Mendoza';
            const phone = '261-1234567';
            const email = 'comprador_prueba@example.com';
            const status = 'pending'; // Estado inicial de la orden

            const insertOrderQuery = `
                INSERT INTO public.orders (user_id, total, full_name, address, city, province, phone, email, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id;
            `;
            // --- DESCOMENTAR Y ADAPTAR ESTO CUANDO CONECTES LA DB ---
            /*
            const orderResult = await pool.query(insertOrderQuery, [
                user_id,
                orderTotal,
                full_name,
                address,
                city,
                province,
                phone,
                email,
                status
            ]);
            orderId = orderResult.rows[0].id;
            */
            orderId = `mock_order_${Date.now()}`; // Simulación de ID de orden para pruebas
            console.log(`Orden creada en DB (simulada): ID ${orderId}, Total: ${orderTotal}`);

        } catch (dbError) {
            console.error('Error al insertar la orden en la base de datos:', dbError);
            return res.status(500).json({ message: 'Error al procesar la orden en el servidor.', error: dbError.message });
        }
        // --- FIN: CREAR LA ORDEN EN TU BASE DE DATOS ---


        const preferenceBody = {
            items: itemsForMercadoPago,
            payer: {
                // Puedes pre-rellenar datos del pagador si los tienes (ej. del usuario logueado)
                email: email, // Usar el email de la orden
                name: full_name // Usar el nombre de la orden
            },
            back_urls: {
                // Desactivado para evitar el error HTTPS en desarrollo local
                // Cuando despliegues, asegúrate de que estas URLs sean HTTPS y reales.
                success: 'http://localhost:3000/success',
                failure: 'http://localhost:3000/failure',
                pending: 'http://localhost:3000/pending',
            },
            // auto_return: 'approved', // Desactivado para evitar el error HTTPS en desarrollo local
            // notifications_url: 'https://tu-dominio.com/webhook-mercadopago', // ¡MUY IMPORTANTE para producción!
            external_reference: orderId.toString() // <-- CRÍTICO: Usar el ID de la orden de tu DB
        };

        const preference = new Preference(client);
        const response = await preference.create({ body: preferenceBody });

        console.log('Mercado Pago preference created, init_point:', response.init_point);
        res.json({ init_point: response.init_point });

    } catch (error) {
        console.error('Error in /create_preference route:', error);
        res.status(500).json({ message: 'Error al crear la preferencia de pago en el servidor.', error: error.message });
    }
});

// Rutas de redirección para back_urls de Mercado Pago
app.get('/success', (req, res) => {
    // Aquí podrías mostrar un mensaje de éxito, y si tienes webhooks,
    // el estado final de la orden ya se habrá actualizado en tu DB.
    // También podrías pasar el external_reference (ID de la orden) para buscarla.
    const externalReference = req.query.external_reference; // Mercado Pago lo envía
    console.log(`Redirigido a success. Ref. externa: ${externalReference}`);
    res.send('<h1>¡Pago exitoso! Gracias por tu compra.</h1><p>Puedes cerrar esta ventana.</p><p>Referencia de tu orden: ' + externalReference + '</p>');
});

app.get('/failure', (req, res) => {
    const externalReference = req.query.external_reference;
    console.log(`Redirigido a failure. Ref. externa: ${externalReference}`);
    res.send('<h1>El pago falló.</h1><p>Hubo un problema con tu pago. Por favor, intenta de nuevo.</p><p>Referencia de tu orden: ' + externalReference + '</p>');
});

app.get('/pending', (req, res) => {
    const externalReference = req.query.external_reference;
    console.log(`Redirigido a pending. Ref. externa: ${externalReference}`);
    res.send('<h1>Tu pago está pendiente.</h1><p>Tu pago está pendiente de aprobación. Te notificaremos cuando se complete.</p><p>Referencia de tu orden: ' + externalReference + '</p>');
});
// --- FIN: RUTAS DE MERCADO PAGO ---


// 3) Servir front-end estático
// Asegúrate de que tu `public` folder contenga tus archivos HTML, CSS, JS del frontend
app.use(express.static(path.join(__dirname, 'public')));


// Middleware de manejo de errores (siempre al final de todas las rutas y middleware)
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err.stack);
    res.status(500).json({
        message: 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
});


// 4) Arrancar servidor
app.listen(PORT, () => console.log(`Server en http://localhost:${PORT}`));