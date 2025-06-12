// =================================================================
// IMPORTS Y CONFIGURACIÓN INICIAL
// =================================================================
const express = require('express');
const session = require('express-session');
const pool = require('./db'); // Conexión a la base de datos desde db.js
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const { MercadoPagoConfig, Preference } = require('mercadopago');

// Cargar variables de entorno del archivo .env
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración del cliente de Mercado Pago (usando tu variable de entorno)
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});


// =================================================================
// MIDDLEWARE (El orden es importante)
// =================================================================

// Configuración de Helmet para seguridad
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      // AÑADIDO: Permitir scripts de Mercado Pago. Si no, el checkout no cargará.
      scriptSrc: ["'self'", "https://sdk.mercadopago.com"], 
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://*.mercadopago.com"], // AÑADIDO: para logos e imágenes de MP
      connectSrc: ["'self'", "https://api.mercadopago.com"], // AÑADIDO: para que el frontend hable con la API de MP
      frameSrc: ["https://*.mercadopago.com"], // AÑADIDO: para el iframe del checkout
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

// 1. Middleware para registrar cada solicitud que llega
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Request Received: ${req.method} ${req.url}`);
    if (req.method === 'POST' && req.body && Object.keys(req.body).length > 0) {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// 2. Middleware de CORS para permitir solicitudes desde el frontend
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 3. Middleware para entender el formato JSON
app.use(express.json());


// =================================================================
// RUTAS DE LA API (Deben ir ANTES de servir los archivos estáticos)
// =================================================================

// --- RUTA PARA OBTENER TODAS LAS CATEGORÍAS ---
app.get('/api/categories', async (req, res) => {
    const query = `
        SELECT DISTINCT pc.category_name as name
        FROM public.product_category pc
        INNER JOIN public.products p ON pc.id = p.category
        ORDER BY pc.category_name ASC;
    `;
    try {
        const result = await pool.query(query);
        const categoryNames = result.rows.map(row => row.name);
        res.json(categoryNames);
    } catch (error) {
        console.error('Error al obtener categorías (GET /api/categories):', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al obtener categorías.' });
    }
});


// --- RUTA PARA OBTENER PRODUCTOS (con filtro opcional por categoría) ---
app.get('/api/products', async (req, res) => {
    const { category } = req.query;
    let baseQuery = `
        SELECT
            p.id, p.name, p.image_url, p.description,
            p.discount AS discount_value, p.price, p.stock
        FROM public.products p
    `;
    const queryParams = [];
    if (category) {
        baseQuery += `
            JOIN public.product_category pc ON p.category = pc.id
            WHERE pc.category_name = $1
        `;
        queryParams.push(category);
    }
    baseQuery += ' ORDER BY p.id;';
    try {
        const result = await pool.query(baseQuery, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener productos (GET /api/products):', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al obtener productos.' });
    }
});

// =================================================================
// INICIO: RUTAS DE MERCADO PAGO
// =================================================================

// --- RUTA PARA CREAR LA PREFERENCIA DE PAGO ---
app.post('/crear-preferencia', async (req, res) => {
  try {
    const productosDelCarrito = req.body.productos;

    if (!productosDelCarrito || !Array.isArray(productosDelCarrito) || productosDelCarrito.length === 0) {
      return res.status(400).json({ error: 'La lista de productos está vacía o no es válida.' });
    }

    const items = productosDelCarrito.map(producto => ({
      title: producto.nombre,
      description: producto.descripcion || 'Producto de la tienda',
      quantity: Number(producto.cantidad),
      currency_id: 'ARS',
      unit_price: Number(producto.precio),
    }));

    const body = {
      items: items,
      back_urls: {
        success: 'http://localhost:3000/feedback', // Puedes cambiar esta URL a una página de éxito de tu frontend
        failure: 'http://localhost:3000/feedback', // Puedes cambiar esta URL a una página de error de tu frontend
        pending: 'http://localhost:3000/feedback', // Puedes cambiar esta URL a una página de pendiente de tu frontend
      },
      auto_return: 'approved',
    };

    const preference = new Preference(client);
    const result = await preference.create({ body });
    
    res.json({ id: result.id });

  } catch (error) {
    console.error('Error al crear la preferencia:', error);
    res.status(500).json({ error: 'Hubo un error en el servidor al crear la preferencia.' });
  }
});

// --- RUTA DE FEEDBACK PARA EL USUARIO DESPUÉS DEL PAGO ---
app.get('/feedback', (req, res) => {
    // Aquí podrías guardar el estado del pago en tu base de datos
    console.log('Feedback de Mercado Pago recibido:');
    console.log('Payment ID:', req.query.payment_id);
    console.log('Status:', req.query.status);
    console.log('Merchant Order ID:', req.query.merchant_order_id);

    // Redirigir al usuario a una página de "gracias" en tu frontend
    // res.redirect(`http://127.0.0.1:5500/tu-pagina-de-gracias.html?status=${req.query.status}`);
    
    // O simplemente mostrar un mensaje genérico
    res.send(`
        <h1>Procesando tu pago...</h1>
        <p>Estado: ${req.query.status}</p>
        <p>Gracias por tu compra.</p>
    `);
});

// =================================================================
// FIN: RUTAS DE MERCADO PAGO
// =================================================================


// =================================================================
// SERVIR ARCHIVOS ESTÁTICOS (Frontend)
// =================================================================
// Esto le dice a Express que sirva tu frontend. Debe ir DESPUÉS de tus rutas de API.
app.use(express.static(path.join(__dirname, 'public')));


// =================================================================
// INICIAR SERVIDOR
// =================================================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});