// Este archivo crea y configura el cliente de Mercado Pago con tu credencial.
// Usa la forma moderna del SDK.

const { MercadoPagoConfig } = require('mercadopago');
require('dotenv').config();

// 1. Crea un "cliente" con tu Access Token de .env
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
});

// 2. Exporta este cliente para que otros archivos lo puedan usar
module.exports = client;