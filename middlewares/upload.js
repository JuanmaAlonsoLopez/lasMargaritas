const multer = require('multer');
const path = require('path');

// --- Configuración de almacenamiento de Multer ---
const storage = multer.diskStorage({
  // 1. Destino: Dónde se guardará el archivo
  destination: function (req, file, cb) {
    // Usamos path.join para crear una ruta absoluta y evitar problemas entre SO
    // NOTA: Asegúrate de que la carpeta 'public/images/fotosProductos' exista
    const destPath = path.join(__dirname, '..', 'public', 'images', 'fotosProductos');
    cb(null, destPath);
  },
  // 2. Nombre del archivo: Para evitar sobreescribir archivos con el mismo nombre
  filename: function (req, file, cb) {
    // Creamos un nombre único: timestamp + nombre original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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