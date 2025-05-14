const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());   

app.get('/usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al consultar usuarios');
    }
});

app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
})