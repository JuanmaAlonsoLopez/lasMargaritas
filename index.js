// =================================================================
// IMPORTS Y CONFIGURACIÓN INICIAL
// =================================================================
const express = require('express');
const session = require('express-session');
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

// 1. Helmet para seguridad (VERSIÓN PARA PRODUCCIÓN)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", PRODUCTION_URL],
      scriptSrc: [
        "'self'",
        PRODUCTION_URL,
        "https://sdk.mercadopago.com",
        "https://*.mercadolibre.com",
        "'unsafe-inline'"
      ],
      styleSrc: ["'self'", PRODUCTION_URL, "https://fonts.googleapis.com", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http://http2.mlstatic.com"],
      connectSrc: [
        "'self'",
        PRODUCTION_URL,
        "https://api.mercadopago.com",
        "https://api.mercadolibre.com"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      frameSrc: [
        "'self'",
        PRODUCTION_URL,
        "https://www.mercadopago.com",
        "https://www.mercadopago.com.ar",
        "https://sandbox.mercadopago.com.ar",
        "http://*.mercadolibre.com"
      ],
      upgradeInsecureRequests: [],
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
app.use(session({
  secret: process.env.SESSION_SECRET || 'un_secreto_muy_seguro',
  resave: false,
  saveUninitialized: false,
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

app.get('/auth/google', passport.authenticate('google', { scope: ['profile','email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login.html' }), googleCallback);

// --- RUTA PARA CREAR LA PREFERENCIA DE PAGO (VERSIÓN PARA PRODUCCIÓN) ---
app.post('/api/pagos/crear-preferencia', async (req, res) => {
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
            back_urls: { 
                success: `${PRODUCTION_URL}/pages/success.html`,
                failure: `${PRODUCTION_URL}/pages/failure.html`,
                pending: `${PRODUCTION_URL}/pages/pending.html`,
            },
            auto_return: 'approved',
        };
        
        console.log("OBJETO ENVIADO A MERCADO PAGO:", JSON.stringify(body, null, 2));

        const preference = new Preference(mpClient);
        const result = await preference.create({ body });
        
        console.log('Preferencia creada con éxito. ID:', result.id);
        res.json({ id: result.id });

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