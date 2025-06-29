// Este archivo define las RUTAS (URLs) para el pago.

const express = require('express');
const router = express.Router();

// Importamos el controlador que tiene la lógica
const pagoController = require('../controllers/pagoController');

// Línea 6: Cuando llegue un POST a /crear-preferencia,
// ejecuta la función "crearPreferencia" del objeto "pagoController".
router.post('/crear-preferencia', pagoController.crearPreferencia);

module.exports = router;