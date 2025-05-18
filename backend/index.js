const express = require('express');
const pool = require('./db');
const authRoutes = require('./routes/auth');
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

// 2) Rutas
app.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al consultar usuarios');
  }
});

app.use('/api/auth', authRoutes);

// 3) Servir front-end estático (si usas esta opción)
//    Mueve tus HTML/JS/CSS a /backend/public
app.use(express.static(path.join(__dirname, 'public')));

// 4) Arrancar servidor
app.listen(PORT, () => console.log(`Server en http://localhost:${PORT}`));
