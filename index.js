// =================================================================
// IMPORTS Y CONFIGURACIÓN INICIAL
// =================================================================
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const { MercadoPagoConfig, Preference } = require('mercadopago');
require('dotenv').config();

// --- ARCHIVOS DE TU PROYECTO ---
const pool = require('./db');
const passport = require('./utils/passport');
const { googleCallback } = require('./controllers/authController');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// --- URL DE PRODUCCIÓN ---
const PRODUCTION_URL = 'https://las-margaritas.vercel.app';

// --- CONFIGURACIÓN DEL CLIENTE DE MERCADO PAGO ---
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// =================================================================
// MIDDLEWARE
// =================================================================

// 1. Helmet para seguridad (VERSIÓN DEFINITIVA PARA PRODUCCIÓN)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      // --- General ---
      defaultSrc: ["'self'"], // Por defecto, solo tu dominio
      objectSrc: ["'none'"], // No permitir plugins (Flash, etc.)
      upgradeInsecureRequests: [],

      // --- Scripts ---
      scriptSrc: [
        "'self'", // Scripts de tu dominio
        "https://apis.google.com", // API de Google
        "https://sdk.mercadopago.com", // SDK de Mercado Pago
        "'unsafe-inline'" // Necesario a veces, pero úsalo con precaución
      ],

      // --- Estilos ---
      styleSrc: [
        "'self'",
        "https://fonts.googleapis.com", // Fuentes de Google
        "'unsafe-inline'"
      ],

      // --- Imágenes ---
      imgSrc: [
        "'self'", // Imágenes de tu dominio (favicon.ico)
        "data:", // Imágenes en base64
        "https://lh3.googleusercontent.com", // Avatares de cuentas de Google
        "https://http2.mlstatic.com" // Logos de medios de pago de ML
      ],
      
      // --- Conexiones (APIs, WebSockets) ---
      connectSrc: [
        "'self'", // API propia
        "https://accounts.google.com/o/oauth2/", // Autenticación de Google
        "https://api.mercadopago.com" // API de Mercado Pago
      ],

      // --- Fuentes ---
      fontSrc: ["'self'", "https://fonts.gstatic.com"],

      // --- iFrames ---
      frameSrc: [
        "'self'",
        "https://accounts.google.com/", // iFrame de login de Google
        "https://*.mercadopago.com", // Checkout de Mercado Pago
        "https://*.mercadopago.com.ar"
      ],
    },
  })
);


// 2. CORS y otros middlewares (VERSIÓN PARA PRODUCCIÓN)
const allowedOrigins = [
  'http://localhost:5500', // Mantener para pruebas locales
  'http://127.0.0.1:5500', // Mantener para pruebas locales
  PRODUCTION_URL // <-- URL DE VERCEL PARA PRODUCCIÓN
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
// Configuración de la sesión con PostgreSQL
app.use(session({
  store: new pgSession({
    pool : pool,                // pool de pg ya configurado en db.js
    tableName : 'session',      // Nombre de la tabla para las sesiones (la crearás en tu BD)
    // Insert define table here, if it is still empty
    // createTableIfMissing: true // Opcional: crea la tabla si no existe, pero es mejor crearla manualmente
  }),
  secret: process.env.SESSION_SECRET || 'un_secreto_muy_seguro',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 días de duración de la cookie
}));
app.use(passport.initialize());
app.use(passport.session());


// =================================================================
// RUTAS
// =================================================================

// Redirige la ruta raíz a login.html para una entrada limpia
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.get('/auth/google', passport.authenticate('google', { scope: ['profile','email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login.html' }), googleCallback);

// --- RUTA PARA CREAR LA PREFERENCIA DE PAGO (VERSIÓN PARA PRODUCCIÓN) ---
app.post('/api/pagos/crear-preferencia', async (req, res) => {
    // Verificar si el usuario está logueado
    if (!req.isAuthenticated()) { // `req.isAuthenticated()` es una función de Passport
        return res.status(401).json({ error: 'Debes iniciar sesión para continuar la compra.' });
    }

    try {
        const carrito = req.body.carrito;

        if (!carrito || carrito.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío.' });
        }

        const items = carrito.map(item => ({
            id: item.id.toString(),
            title: item.name,
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.price),
            currency_id: 'ARS',
        }));

        const body = {
            items: items,
            // Las back_urls ahora redirigirán a shipment.html después del pago
            back_urls: {
                success: `${PRODUCTION_URL}/pages/shipment.html?status=success`,
                failure: `${PRODUCTION_URL}/pages/shipment.html?status=failure`,
                pending: `${PRODUCTION_URL}/pages/shipment.html?status=pending`,
            },
            auto_return: 'approved',
        };
        
        console.log("OBJETO ENVIADO A MERCADO PAGO:", JSON.stringify(body, null, 2));

        const preference = new Preference(mpClient);
        const result = await preference.create({ body });
        
        console.log('Preferencia creada con éxito. ID:', result.id);
        res.json({ id: result.id, userId: req.user.id }); // También enviamos el userId

    } catch (error) {
        console.error('Error detallado de MP:', error.cause ? JSON.stringify(error.cause, null, 2) : error.message);
        res.status(500).json({ error: 'Error interno al crear la preferencia.' });
    }
});


// =================================================================
// SERVIR ARCHIVOS ESTÁTICOS Y INICIAR SERVIDOR
// =================================================================
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo y escuchando en http://localhost:${PORT}`);
});