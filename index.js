// =================================================================
// IMPORTS Y CONFIGURACIÓN INICIAL (VERSIÓN FINAL CON PAGOS)
// =================================================================
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const { MercadoPagoConfig, Preference } = require('mercadopago'); // Se importa MercadoPago
require('dotenv').config();

// --- ARCHIVOS DE TU PROYECTO ---
const pool = require('./db');
const transporter = require('./utils/mailer');
const passport = require('./utils/passport');
const { googleCallback } = require('./controllers/authController');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products'); 

const app = express();
const PORT = process.env.PORT || 3000;

// --- ¡NUEVO! CONFIGURACIÓN DEL CLIENTE DE MERCADO PAGO ---
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});


// =================================================================
// MIDDLEWARE
// =================================================================

// 1. Helmet para seguridad (actualizado para Mercado Pago)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://sdk.mercadopago.com"], // Permite el script de MP
      styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://api.mercadopago.com"], // Permite la conexión a la API de MP
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'", "https://www.mercadopago.com", "https://www.mercadopago.com.ar"], // Permite el iframe del checkout
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
// app.get('/api/categories', async (req, res) => {
//     try {
//         const result = await pool.query("SELECT DISTINCT category_name as name FROM public.product_category ORDER BY name ASC;");
//         res.json(result.rows.map(row => row.name));
//     } catch (error) {
//         res.status(500).json({ message: 'Error interno del servidor.' });
//     }
// });
// app.get('/api/products', async (req, res) => {
//     const { category } = req.query;
//     let baseQuery = `
//         SELECT p.id, p.name, p.image_url, p.description, p.discount AS discount_value, p.price, p.stock
//         FROM public.products p
//     `;
//     const queryParams = [];
//     if (category) {
//         baseQuery += ` JOIN public.product_category pc ON p.category = pc.id WHERE pc.category_name = $1`;
//         queryParams.push(category);
//     }
//     baseQuery += ' ORDER BY p.id;';
//     try {
//         const result = await pool.query(baseQuery, queryParams);
//         res.json(result.rows);
//     } catch (error) {
//         res.status(500).json({ message: 'Error interno del servidor.' });
//     }
// });


// --- ¡NUEVO! RUTA PARA CREAR LA PREFERENCIA DE PAGO ---
app.post('/create_preference', async (req, res) => {
    const clientCartItems = req.body.items;
    const { full_name, email } = req.body;

    if (!clientCartItems || clientCartItems.length === 0) {
        return res.status(400).json({ message: 'El carrito está vacío.' });
    }

    try {
        // Por seguridad, obtenemos los precios y stock desde nuestra base de datos
        const productIds = clientCartItems.map(item => item.id);
        const productsQuery = `SELECT id, name, price, stock FROM public.products WHERE id = ANY($1::int[])`;
        const dbProductsResult = await pool.query(productsQuery, [productIds]);
        const productsMap = new Map(dbProductsResult.rows.map(p => [p.id, p]));

        let itemsForMercadoPago = [];
        for (const clientItem of clientCartItems) {
            const productFromDB = productsMap.get(clientItem.id);
            if (!productFromDB || productFromDB.stock < clientItem.quantity) {
                return res.status(400).json({ message: `Stock insuficiente o producto no encontrado.` });
            }
            itemsForMercadoPago.push({
                id: productFromDB.id.toString(),
                title: productFromDB.name,
                quantity: parseInt(clientItem.quantity),
                unit_price: parseFloat(productFromDB.price), // Usamos el precio de la DB
                currency_id: 'ARS'
            });
        }

        // Creamos el objeto de preferencia
        const preference = new Preference(mpClient);
        const response = await preference.create({
            body: {
                items: itemsForMercadoPago,
                payer: { email: email, name: full_name },
                back_urls: {
                    success: `http://127.0.0.1:5500/public/success.html`, // O la URL de tu frontend
                    failure: `http://127.0.0.1:5500/public/failure.html`,
                },
                auto_return: 'approved',
            }
        });
        
        // Enviamos el link de pago al frontend
        res.json({ init_point: response.init_point });

    } catch (error) {
        console.error('Error al crear la preferencia de pago:', error);
        res.status(500).json({ message: 'Error interno al crear la preferencia de pago.' });
    }
});


// =================================================================
// SERVIR ARCHIVOS ESTÁTICOS Y INICIAR SERVIDOR
// =================================================================
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo y escuchando en http://localhost:${PORT}`);
    transporter.verify((err, success) => {
        if (err) {
            console.error('Mailer error:', err);
        } else {
            console.log('✅ Mailer está listo para enviar correos.');
        }
    });
});