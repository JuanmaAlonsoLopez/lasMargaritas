const express = require('express');
const session = require('express-session');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const { googleCallback } = require('./controllers/authController');
const passport = require('./utils/passport');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1) Habilitar CORS _antes_ de cualquier ruta
app.use(cors({
  origin: 'http://127.0.0.1:5500',    // o 'http://localhost:5500'
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());


app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile','email'] })
);

// Ruta de callback: ahora delega al authController
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html' }),
  googleCallback
);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);

// 3) Servir front-end estático (si usas esta opción)
app.use(express.static(path.join(__dirname, 'public')));

// 4) Arrancar servidor
app.listen(PORT, () => console.log(`Server en http://localhost:${PORT}`));
