const { Pool } = require('pg');
require('dotenv').config(); // Carga las variables desde tu archivo .env

// Configuración del Pool para la base de datos LOCAL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE, // <-- CORREGIDO: Usamos DB_DATABASE como en tu .env
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    // No se necesita la configuración 'ssl' para una conexión local estándar
});

// (Opcional pero recomendado) Prueba la conexión al iniciar la aplicación
pool.connect((err, client, release) => {
    if (err) {
        // Mensaje de error más claro para el entorno local
        return console.error('Error al conectar con la base de datos local:', err.stack);
    }
    // Mensaje de éxito claro
    console.log('✅ ¡Conectado exitosamente a la base de datos local!');
    client.release(); // Libera el cliente de vuelta al pool
});

module.exports = pool;