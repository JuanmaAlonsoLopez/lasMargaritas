const mercadopago = require('mercadopago');

try {
    console.log('Mercado Pago module loaded successfully.');
    console.log('Type of mercadopago:', typeof mercadopago);
    console.log('Is configure a function?', typeof mercadopago.configure === 'function');

    if (typeof mercadopago.configure === 'function') {
        console.log('mercadopago.configure() exists!');
        mercadopago.configure({
            access_token: 'YOUR_TEST_ACCESS_TOKEN', // Puedes poner un token de prueba aquí
        });
        console.log('Mercado Pago configured.');
    } else if (mercadopago.configurations && typeof mercadopago.configurations.setAccessToken === 'function') {
        console.log('Using old SDK configuration (V1).');
        mercadopago.configurations.setAccessToken('YOUR_TEST_ACCESS_TOKEN');
        console.log('Mercado Pago configured with old method.');
    } else {
        console.error('Neither configure() nor configurations.setAccessToken() found. Module is unexpected.');
        console.log('Mercado Pago object:', mercadopago); // Imprime el objeto completo
    }

} catch (e) {
    console.error('Error loading or configuring Mercado Pago:', e);
}