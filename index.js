// =================================================================
// IMPORTS Y CONFIGURACIÓN INICIAL
// =================================================================
const express = require('express');
const session = require('express-session');
const pool = require('./db'); // Conexión a la base de datos desde db.js
const cors = require('cors');
const path = require('path'); // <-- AÑADIDO: Importa el módulo 'path'
const helmet = require('helmet'); // <-- AÑADIDO: Importa 'helmet' para seguridad
const { MercadoPagoConfig, Preference } = require('mercadopago');

// Cargar variables de entorno del archivo .env
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración del cliente de Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});


// =================================================================
// MIDDLEWARE (El orden es importante)
// =================================================================

// <-- AÑADIDO: Configuración de Helmet para solucionar el Content-Security-Policy
// Esto debe ir ANTES de tus otras rutas y middleware.
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
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
    // ... tu código de la ruta de categorías aquí ...
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
    // ... tu código de la ruta de productos aquí ...
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

// ... Aquí van tus otras rutas de API como /create_preference ...


// =================================================================
// SERVIR ARCHIVOS ESTÁTICOS (Frontend)
// =================================================================

// <-- DESCOMENTADO Y CORREGIDO: Esto le dice a Express que sirva tu frontend.
// Debe ir DESPUÉS de tus rutas de API.
app.use(express.static(path.join(__dirname, 'public')));


// =================================================================
// INICIAR SERVIDOR
// =================================================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});