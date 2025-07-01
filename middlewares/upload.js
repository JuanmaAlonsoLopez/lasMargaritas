const multer = require('multer');

// --- Configuración de almacenamiento de Multer ---
// Usamos memoryStorage para que Multer guarde el archivo en la memoria del servidor.
// Luego, nuestro controlador lo leerá de la memoria y lo subirá a GCS.
const storage = multer.memoryStorage();

// --- Filtro de archivos: Asegurarnos que solo se suban imágenes ---
const fileFilter = (req, file, cb) => {
  // Expresión regular para verificar si el archivo es una imagen
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // Aceptar el archivo
  } else {
    cb(new Error('¡Solo se permiten archivos de imagen!'), false); // Rechazar el archivo
  }
};

// --- Inicializar Multer con la configuración ---
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // Límite de 5MB por archivo
  }
});

module.exports = upload;