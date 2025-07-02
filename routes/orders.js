// routes/orders.js

const express = require('express');
const pool = require('../db');
const router = express.Router();
const { isAuthenticated, isAuthorized } = require('../middlewares/auth'); // Asumiendo que tienes un middleware de autenticación

// --- RUTA POST para crear una Orden y guardar ítems del carrito ---
router.post('/', isAuthenticated, async (req, res) => {
    const { userId, total, fullName, address, city, province, phone, email, cartItems } = req.body;
    const client = await pool.connect(); // Usar cliente para transacción

    try {
        await client.query('BEGIN'); // Iniciar transacción

        // 1. Insertar en la tabla 'orders'
        const orderStatus = 'pendiente'; // Puedes definir un estado inicial, ej. 'pendiente'
        const orderQuery = `
            INSERT INTO public.orders (user_id, total, full_name, address, city, province, phone, email, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;
        `;
        const orderValues = [userId, total, fullName, address, city, province, phone, email, orderStatus];
        const newOrderResult = await client.query(orderQuery, orderValues);
        const orderId = newOrderResult.rows[0].id;

        // 2. Insertar los ítems del carrito en una tabla de ítems de la orden (si la tuvieras, ejemplo: order_items)
        // Opcional: Si no tienes order_items, puedes saltarte este paso y considerar cart_items como los ítems del carrito.
        // PERO es *mejor* guardar una copia de los ítems en la orden para histórico.
        // Si tienes una tabla 'order_items' (ej. order_id, product_id, quantity, price_at_purchase)
        // Ejemplo asumiendo que quieres guardar una copia de los cart_items en una nueva tabla order_items
        /*
        const orderItemsQuery = `
            INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase)
            VALUES ($1, $2, $3, $4);
        `;
        for (const item of cartItems) {
            // Necesitarías el precio del producto al momento de la compra
            // Aquí lo obtendrías del objeto 'item' que viene del frontend o lo buscarías en la BD
            await client.query(orderItemsQuery, [orderId, item.product_id, item.quantity, item.price]);
        }
        */

        // Por ahora, si no tienes order_items, simplemente puedes confiar en orders para el pedido.
        // PERO ES CRÍTICO: Eliminar los ítems del carrito de la tabla 'cart_items' y el carrito de 'carts'
        await client.query('DELETE FROM public.cart_items WHERE user_id = $1;', [userId]);
        await client.query('DELETE FROM public.carts WHERE user_id = $1;', [userId]);


        await client.query('COMMIT'); // Confirmar transacción

        res.status(201).json({ message: 'Pedido creado exitosamente', orderId: orderId });

    } catch (error) {
        await client.query('ROLLBACK'); // Revertir transacción si hay error
        console.error('Error al crear el pedido:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear el pedido.' });
    } finally {
        client.release(); // Liberar el cliente de la pool
    }
});

// --- RUTA GET para obtener todos los pedidos (para admin) ---
router.get('/', isAuthenticated, isAuthorized([1]), async (req, res) => { // Rol 1 = Administrador
    try {
        const ordersQuery = `
            SELECT
                o.id,
                o.user_id,
                u.email as user_email,
                o.total,
                o.created_at,
                o.full_name,
                o.address,
                o.city,
                o.province,
                o.phone,
                o.email,
                o.status
            FROM
                public.orders AS o
            JOIN
                public.users AS u ON o.user_id = u.id
            ORDER BY o.created_at DESC;
        `;
        const { rows } = await pool.query(ordersQuery);

        // Opcional: Si tienes order_items, puedes obtenerlos aquí y adjuntarlos a cada orden
        // for (const order of rows) {
        //     const itemsResult = await pool.query('SELECT product_id, quantity, price_at_purchase FROM public.order_items WHERE order_id = $1', [order.id]);
        //     order.items = itemsResult.rows;
        // }

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener los pedidos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener pedidos.' });
    }
});

module.exports = router;