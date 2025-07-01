const { Storage } = require('@google-cloud/storage');

// Decodifica las credenciales de la cuenta de servicio de Base64
const serviceAccountKeyBase64 = process.env.GCP_SERVICE_ACCOUNT_KEY_BASE64;

let storage;
if (serviceAccountKeyBase64) {
  try {
    const serviceAccountKey = JSON.parse(Buffer.from(serviceAccountKeyBase64, 'base64').toString('utf8'));
    storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      credentials: {
        client_email: serviceAccountKey.client_email,
        private_key: serviceAccountKey.private_key.replace(/\\n/g, '\n'), // Asegura saltos de línea correctos
      },
    });
  } catch (error) {
    console.error('Error al parsear credenciales de GCS:', error);
    // En un entorno de producción, podrías querer terminar el proceso o manejar el error de forma más robusta
    storage = null; // Para evitar que el servidor falle si las credenciales son incorrectas
  }
} else {
  console.warn('GCP_SERVICE_ACCOUNT_KEY_BASE64 no está configurado. GCS no funcionará.');
  storage = null;
}

const bucket = storage ? storage.bucket(process.env.GCP_BUCKET_NAME) : null;

module.exports = bucket;