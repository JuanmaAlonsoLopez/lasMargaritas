const express = require('express');
const mercadopago = require('mercadopago');
const app = express();
const bodyParser = require('body-parser');

// Configura tu token de acceso
mercadopago.configurations.setAccessToken('APP_USR-6151982492022519-060920-ed5fdd184d492b16a07375d5b26f668c-1316664670');

app.use(bodyParser.json());

// Ruta para crear la preferencia
app.post('/create_preference', async (req, res) => {
    // Definir los detalles del producto y la preferencia
    const preference = {
        items: [
            {
                title: 'Almohadón Ortopédico Deluxe - 70x50 cm',
                quantity: 1,
                unit_price: 9290, // El precio del producto
            },
        ],
        // back_urls: {
        //     success: 'http://www.tusitio.com/success',
        //     failure: 'http://www.tusitio.com/failure',
        //     pending: 'http://www.tusitio.com/pending',
        // },
        auto_return: 'approved', // Hacer la devolución automática en caso de éxito
    };

    try {
        // Crear la preferencia de pago
        const response = await mercadopago.preferences.create(preference);
        // Enviar la URL de pago
        res.json({ init_point: response.body.init_point });
    } catch (error) {
        // Manejar cualquier error de la creación de la preferencia
        console.error(error);
        res.status(500).send({ message: 'Error al crear la preferencia de pago' });
    }
});

// Iniciar servidor
app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});

