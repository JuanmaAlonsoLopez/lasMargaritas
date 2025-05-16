const express = require('express');
const pool = require('./db');
const authRoutes = require('./routes/auth'); // rutas de auth que creaste
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

// Ruta que ya tenías para obtener usuarios
app.get('/usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al consultar usuarios');
    }
});

// Usar rutas de autenticación bajo /api/auth
app.use('/api/auth', authRoutes);
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => console.log(`Server en http://localhost:${PORT}`));
