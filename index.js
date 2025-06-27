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

// --- CONFIGURACIÓN DEL CLIENTE DE MERCADO PAGO ---
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// =================================================================
// MIDDLEWARE
// =================================================================

// 1. Helmet para seguridad (CORREGIDO PARA PERMITIR MERCADO PAGO)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      // Se permiten los scripts de tu propio sitio y de los dominios de MP.
      scriptSrc: ["'self'", "https://sdk.mercadopago.com", "https://*.mercadolibre.com", "'unsafe-inline'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http://http2.mlstatic.com"], 
      // Permite la conexión a las APIs necesarias.
      connectSrc: ["'self'", "http://localhost:3000", "https://api.mercadopago.com", "*.mercadolibre.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      // Permite que el checkout de MP se muestre en un iframe.
      frameSrc: ["'self'", "https://www.mercadopago.com", "https://www.mercadopago.com.ar", "*.mercadolibre.com"],
      upgradeInsecureRequests: [],
    },
  })
);

// 2. CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

// 3. Otros middlewares
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

// Rutas de Autenticación y API existentes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

app.get('/auth/google', passport.authenticate('google', { scope: ['profile','email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login.html' }), googleCallback);

// --- RUTA UNIFICADA Y CORREGIDA PARA CREAR LA PREFERENCIA DE PAGO ---
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
            back_urls: { // ¡EN PLURAL! Esta es la corrección del error de la terminal.
                success: 'http://127.0.0.1:5500/pages/paginaError.html?status=success', 
                failure: 'http://127.0.0.1:5500/pages/paginaError.html?status=failure',
                pending: '',
            },
            auto_return: 'approved',
        };

        const preference = new Preference(mpClient);
        const result = await preference.create({ body });
        
        res.json({ id: result.id });

    } catch (error) {
        console.error('Error al crear la preferencia:', error.cause ? JSON.stringify(error.cause) : error.message);
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
