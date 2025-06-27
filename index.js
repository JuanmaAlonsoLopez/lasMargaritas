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

// 1. Helmet para seguridad (VERSIÓN FINAL Y DEFINITIVA)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      // Asegúrate de que script-src permite los scripts de Mercado Pago
      scriptSrc: [
        "'self'", 
        "https://sdk.mercadopago.com", 
        "https://*.mercadolibre.com", 
        "'unsafe-inline'" // Necesario si tienes scripts inline
      ],
      styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http://http2.mlstatic.com"], 
      connectSrc: [
        "'self'", 
        "http://localhost:3000", // Tu propio backend
        "https://api.mercadopago.com" // API de MP
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      
      // =======================================================
      // ====>         AQUÍ ESTÁ LA LÍNEA CLAVE               <====
      // Esta directiva autoriza la carga de iframes desde
      // cualquier subdominio de mercadopago.com y mercadopago.com.ar
      // =======================================================
      frameSrc: [
        "'self'",
        "https://www.mercadopago.com",
        "https://www.mercadopago.com.ar",
        "https://mercadopago.com",
        "https://mercadopago.com.ar",
        "http://*.mercadolibre.com"
      ],
      
      upgradeInsecureRequests: [],
    },
  })
);


// 2. CORS y otros middlewares
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
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

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

app.get('/auth/google', passport.authenticate('google', { scope: ['profile','email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login.html' }), googleCallback);

// --- RUTA PARA CREAR LA PREFERENCIA DE PAGO ---
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

        // =======================================================
        // ====>               ¡AQUÍ ESTÁ LA SOLUCIÓN!         <====
        // Se elimina la propiedad 'auto_return' para pruebas locales.
        // =======================================================
        const body = {
            items: items,
            back_urls: { 
                success: 'http://127.0.0.1:5500/pages/success.html', // Puedes crear esta página
                failure: 'http://127.0.0.1:5500/pages/failure.html', // Puedes crear esta página
                pending: 'http://127.0.0.1:5500/pages/pending.html', // Puedes crear esta página
            },
        };
        
        console.log("OBJETO ENVIADO A MERCADO PAGO:", JSON.stringify(body, null, 2));

        const preference = new Preference(mpClient);
        const result = await preference.create({ body });
        
        // ¡Si llegamos aquí, todo salió bien!
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
