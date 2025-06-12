// =================================================================
// IMPORTS Y CONFIGURACIÓN INICIAL
// =================================================================
const express = require('express');
const session = require('express-session');
const pool = require('./db'); // Conexión a la base de datos
const cors = require('cors');
const path = require('path');
const { MercadoPagoConfig, Preference } = require('mercadopago');

require('dotenv').config(); // Cargar variables de entorno del archivo .env

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración del cliente de Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});


// =================================================================
// MIDDLEWARE (ORDEN CORRECTO ES CRUCIAL)
// =================================================================

// ✅ 1. MIDDLEWARE DE LOG (PRIMERO)
// Se ejecuta para CADA solicitud que llega al servidor, incluidas las OPTIONS.
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Request Received: ${req.method} ${req.url}`);
    if (req.method === 'POST' && req.body && Object.keys(req.body).length > 0) {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// ✅ 2. MIDDLEWARE DE CORS (SEGUNDO)
// Configuración mejorada para evitar problemas de cookies y CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ 3. MIDDLEWARE PARA PARSEAR JSON
// Necesario para leer el `req.body` en las solicitudes POST/PUT.
app.use(express.json());


// =================================================================
// RUTAS DE AUTENTICACIÓN (Comentadas para simplificar)
// =================================================================
/*
const authRoutes = require('./routes/auth');
const { googleCallback } = require('./controllers/authController');
const passport = require('./utils/passport');
const jwt = require('jsonwebtoken');
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

// =================================================================
// RUTAS DE LA API
// =================================================================

// --- RUTA PARA OBTENER CATEGORÍAS ACTIVAS ---
// Devuelve una lista de nombres de categorías que tienen productos en promoción.
app.get('/api/categories', async (req, res) => {
    // Esta consulta selecciona los nombres distintos de las categorías
    // que están asociadas con al menos un producto que tenga 'promotion_active = TRUE'.
    const query = `
        SELECT DISTINCT
            pc.name
        FROM
            public.product_category pc
        JOIN
            public.products p ON pc.id = p.category
        WHERE
            p.promotion_active = TRUE
        ORDER BY
            pc.name ASC;
    `;

    try {
        const result = await pool.query(query);
        // Enviamos solo un array de strings (nombres de categorías)
        const categoryNames = result.rows.map(row => row.name);
        res.json(categoryNames);
    } catch (error) {
        console.error('Error al obtener categorías activas (GET /api/categories):', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al obtener categorías.' });
    }
});


// === INICIO DEL CÓDIGO AÑADIDO ===

// --- RUTA PARA OBTENER PRODUCTOS ---
// Devuelve una lista de productos, opcionalmente filtrada por categoría.
app.get('/api/products', async (req, res) => {
    // Obtiene el parámetro 'category' de la URL (ej: /api/products?category=Confort)
    const { category } = req.query;

    // Renombramos la columna 'discount' a 'discount_value' para que coincida con tu HTML.
    // Solo traemos productos que estén activos para la promoción.
    let baseQuery = `
        SELECT
            p.id,
            p.name,
            p.image_url,
            p.description,
            p.promotion_active,
            p.discount AS discount_value,
            pc.name AS category_name,
            p.price,
            p.stock
        FROM
            public.products p
        JOIN
            public.product_category pc ON p.category = pc.id
        WHERE
            p.promotion_active = TRUE
    `;

    const queryParams = [];

    // Si se proporciona una categoría en la URL, se añade un filtro a la consulta
    if (category) {
        baseQuery += ' AND pc.name = $1';
        queryParams.push(category);
    }

    baseQuery += ' ORDER BY p.id;'; // Ordenamos para un resultado consistente

    console.log(`Ejecutando consulta para productos: ${baseQuery.trim()}`);
    if (queryParams.length > 0) {
        console.log(`Con parámetros: ${JSON.stringify(queryParams)}`);
    }

    try {
        const result = await pool.query(baseQuery, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener productos (GET /api/products):', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al obtener productos.' });
    }
});

// === FIN DEL CÓDIGO AÑADIDO ===


// --- RUTAS DE MERCADO PAGO ---

// Ruta para crear la preferencia de pago
app.post('/create_preference', async (req, res) => {
    const clientCartItems = req.body.items;
    const { full_name, address, city, province, phone, email, user_id } = req.body;

    if (!clientCartItems || clientCartItems.length === 0) {
        return res.status(400).json({ message: 'El carrito está vacío o no se enviaron ítems.' });
    }
    if (!full_name || !address || !city || !province || !phone || !email) {
        return res.status(400).json({ message: 'Faltan datos de envío o contacto del cliente.' });
    }

    try {
        // Validar productos y stock contra la base de datos real
        const productIds = clientCartItems.map(item => item.id);
        const productsQuery = `
            SELECT id, name, price, stock, promotion_active, discount AS discount_value
            FROM public.products
            WHERE id = ANY($1::int[]) AND promotion_active = TRUE
        `;
        const dbProductsResult = await pool.query(productsQuery, [productIds]);
        const productsMap = new Map(dbProductsResult.rows.map(p => [p.id, p]));

        let itemsForMercadoPago = [];
        let orderTotal = 0;

        for (const clientItem of clientCartItems) {
            const productFromDB = productsMap.get(clientItem.id);

            if (!productFromDB) {
                return res.status(404).json({ message: `Producto con ID ${clientItem.id} no encontrado o no está en promoción.` });
            }
            if (productFromDB.stock < clientItem.quantity) {
                return res.status(400).json({ message: `No hay suficiente stock para ${productFromDB.name}.` });
            }

            let finalPrice = parseFloat(productFromDB.price);
            if (productFromDB.discount_value && productFromDB.discount_value > 0) {
                finalPrice = finalPrice * (1 - (parseFloat(productFromDB.discount_value) / 100));
            }

            itemsForMercadoPago.push({
                id: productFromDB.id.toString(),
                title: productFromDB.name,
                quantity: parseInt(clientItem.quantity),
                unit_price: finalPrice,
                currency_id: 'ARS'
            });
            orderTotal += finalPrice * parseInt(clientItem.quantity);
        }

        // Crear la orden en nuestra base de datos
        const insertOrderQuery = `
            INSERT INTO public.orders (user_id, total, full_name, address, city, province, phone, email, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
            RETURNING id;
        `;
        const orderResult = await pool.query(insertOrderQuery, [user_id, orderTotal, full_name, address, city, province, phone, email]);
        const orderId = orderResult.rows[0].id;
        console.log(`Orden creada en DB: ID ${orderId}`);

        // Crear la preferencia de Mercado Pago
        const preferenceBody = {
            items: itemsForMercadoPago,
            payer: { email: email, name: full_name },
            back_urls: {
                success: `http://127.0.0.1:5500/success.html?order_id=${orderId}`, // Redirigir al frontend
                failure: `http://127.0.0.1:5500/failure.html?order_id=${orderId}`,
                pending: `http://127.0.0.1:5500/pending.html?order_id=${orderId}`,
            },
            auto_return: 'approved',
            external_reference: orderId.toString()
        };

        const preference = new Preference(client);
        const response = await preference.create({ body: preferenceBody });
        
        res.json({ init_point: response.init_point });

    } catch (error) {
        console.error('Error en /create_preference:', error.stack);
        res.status(500).json({ message: 'Error al crear la preferencia de pago.', error: error.message });
    }
});


// =================================================================
// SERVIR ARCHIVOS ESTÁTICOS Y MANEJO DE ERRORES (AL FINAL)
// =================================================================

// Servir el frontend estático desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de manejo de errores global (debe ser el último middleware)
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err.stack);
    res.status(500).json({
        message: 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
});


// =================================================================
// INICIAR SERVIDOR
// =================================================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});