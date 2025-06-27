// Este archivo define la LÓGICA para crear el pago.

const { Preference } = require('mercadopago');
const client = require('../mp'); // Importamos el cliente ya configurado de mp.js
const pool = require('../db');   // Tu conexión a la base de datos

const pagoController = {
    // Esta es la función que maneja la creación de la preferencia
    crearPreferencia: async (req, res) => {
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
            // La propiedad se llama "back_urls" (en plural).
            // =======================================================
            const body = {
                items: items,
                back_urls: { // ¡EN PLURAL! Esta era la clave del error.
                    success: 'http://127.0.0.1:5500/pages/paginaError.html?status=success', // Temporalmente usamos esta página
                    failure: 'http://127.0.0.1:5500/pages/paginaError.html?status=failure',
                    pending: '', // Es buena práctica incluirla aunque esté vacía.
                },
                auto_return: 'approved',
            };

            const preference = new Preference(client);
            const result = await preference.create({ body });

            console.log('Preferencia creada con éxito. ID:', result.id);
            
            res.json({ id: result.id });

        } catch (error) {
            console.error('Error al crear la preferencia:', error.cause || error.message);
            res.status(500).json({ error: 'Error interno al crear la preferencia.' });
        }
    },
};

module.exports = pagoController;