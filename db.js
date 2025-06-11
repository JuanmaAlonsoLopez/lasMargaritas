const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {                          // Habilitar SSL para conexiones directas a IP pública
        rejectUnauthorized: false   // Esto permite la conexión sin un certificado CA específico.
                                    // En producción, es más seguro usar 'true' y configurar el certificado CA de Cloud SQL.
    }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error al intentar conectar a la base de datos (IP pública):', err.stack);
    return;
  }
  console.log('¡Conectado exitosamente a la base de datos de Cloud SQL vía IP pública!');
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      console.error('Error al ejecutar una consulta de prueba:', err.stack);
      return;
    }
    console.log('Consulta de prueba (SELECT NOW()) exitosa:', result.rows[0].now);
  });
});

module.exports = pool;