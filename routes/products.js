const express = require('express');
const pool = require('../db');
const upload = require('../middlewares/upload'); // Ahora usa memoryStorage
const router = express.Router();
// Ya no necesitamos 'fs' ni 'path' para el sistema de archivos local
// const fs = require('fs');
const path = require('path'); // Todavía necesitamos 'path' para path.extname

const bucket = require('../utils/gcs.js'); // Importa tu bucket de GCS

// =================================================================
// FUNCIONES AUXILIARES PARA GOOGLE CLOUD STORAGE
// =================================================================

/**
 * Sube un archivo (desde multer memoryStorage) a Google Cloud Storage.
 * @param {Object} file El objeto de archivo de Multer (req.file).
 * @returns {Promise<string>} La URL pública del archivo subido.
 */
const uploadToGCS = async (file) => {
    if (!bucket) {
        throw new Error('Google Cloud Storage no está configurado correctamente.');
    }

    // Genera un nombre de archivo único para GCS
    const fileName = `productos/${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    const blob = bucket.file(fileName);

    // Crea un stream de escritura para subir el archivo
    const blobStream = blob.createWriteStream({
        resumable: false, // Para archivos pequeños, esto puede ser más simple
        metadata: {
            contentType: file.mimetype // Asegura que el navegador sepa qué tipo de archivo es
        }
    });

    return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
            console.error('Error en el stream de subida a GCS:', err);
            reject(err);
        });

        blobStream.on('finish', async () => {
            try {
                // Hacer el archivo público después de subirlo
                await blob.makePublic();
                resolve(blob.publicUrl()); // Devuelve la URL pública
            } catch (makePublicErr) {
                console.error('Error al hacer el archivo público en GCS:', makePublicErr);
                reject(makePublicErr);
            }
        });

        // Escribe el buffer del archivo en el stream de GCS
        blobStream.end(file.buffer);
    });
};

/**
 * Elimina un archivo de Google Cloud Storage.
 * @param {string} imageUrl La URL pública del archivo en GCS.
 */
const deleteFromGCS = async (imageUrl) => {
    if (!bucket) {
        console.warn('Google Cloud Storage no está configurado, no se puede eliminar el archivo.');
        return;
    }

    // Asegúrate de que la URL sea de GCS antes de intentar eliminar
    if (!imageUrl || !imageUrl.includes('storage.googleapis.com')) {
        console.log(`La URL "${imageUrl}" no parece ser de GCS, omitiendo eliminación.`);
        return;
    }

    // Extrae el nombre del archivo (con la ruta dentro del bucket) de la URL de GCS
    // Ejemplo de URL: https://storage.googleapis.com/tu-bucket/productos/nombre-unico.jpg
    // Necesitamos 'productos/nombre-unico.jpg'
    const urlParts = imageUrl.split('/');
    // En una URL de GCS, el nombre del bucket es urlParts[3], la ruta del archivo empieza desde urlParts[4]
    const gcsFilePath = urlParts.slice(4).join('/');

    try {
        const file = bucket.file(gcsFilePath);
        await file.delete();
        console.log(`Archivo ${gcsFilePath} eliminado de GCS.`);
    } catch (error) {
        // Un error 404 significa que el archivo ya no existe, lo cual está bien.
        // Otros errores deben ser loggeados.
        if (error.code !== 404) {
            console.error(`Error al eliminar el archivo ${gcsFilePath} de GCS:`, error);
        } else {
            console.warn(`Archivo ${gcsFilePath} no encontrado en GCS, no se pudo eliminar (posiblemente ya borrado).`);
        }
    }
};

// =================================================================
// RUTAS DE LA API DE PRODUCTOS
// =================================================================

// DEFINIR LA RUTA GET /api/products/
router.get('/', async (req, res) => {
    const { category } = req.query;

    try {
        let baseQuery = `
            SELECT
                p.id,
                p.name,
                p.description,
                p.price,
                p.stock,
                p.image_url,
                pc.category_name,
                p.category as category_id
            FROM
                public.products AS p
            JOIN
                public.product_category AS pc ON p.category = pc.id
        `;

        const queryParams = [];

        if (category) {
            baseQuery += ` WHERE pc.category_name = $1`;
            queryParams.push(category);
        }

        baseQuery += ` ORDER BY p.id;`;

        const { rows } = await pool.query(baseQuery, queryParams);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// --- NUEVA RUTA: GET para obtener todas las categorías ---
router.get('/categories', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, category_name FROM public.product_category ORDER BY category_name');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener las categorías:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// --- NUEVA RUTA: POST para crear un nuevo producto ---
router.post('/', upload.single('image'), async (req, res) => {
    const { name, description, price, stock, category } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'La imagen del producto es requerida.' });
    }

    let imageUrl; // Para guardar la URL de GCS

    try {
        // Sube la imagen a Google Cloud Storage
        imageUrl = await uploadToGCS(req.file);
    } catch (uploadError) {
        console.error('Error al subir imagen a GCS:', uploadError);
        return res.status(500).json({ message: 'Error al subir la imagen.' });
    }

    try {
        const newProductQuery = `
            INSERT INTO public.products (name, description, price, stock, image_url, category, promotion_active, discount)
            VALUES ($1, $2, $3, $4, $5, $6, false, 0)
            RETURNING *;
        `;
        const values = [name, description, parseFloat(price), parseInt(stock), imageUrl, parseInt(category)];

        const { rows } = await pool.query(newProductQuery, values);

        res.status(201).json(rows[0]);

    } catch (error) {
        console.error('Error al crear el producto en la BD:', error);
        // Si la base de datos falla, intenta eliminar la imagen de GCS para evitar orfandad
        if (imageUrl) {
            await deleteFromGCS(imageUrl).catch(deleteErr => console.error('Error al revertir eliminación de imagen en GCS:', deleteErr));
        }
        res.status(500).json({ message: 'Error interno del servidor al guardar el producto.' });
    }
});

router.get('/search', async (req, res) => {
    const { query } = req.query; // El término de búsqueda que viene de la URL (ej: /api/products/search?query=almohada)
    if (!query) {
        return res.status(400).json({ message: 'El término de búsqueda es requerido.' });
    }

    try {
        const searchQuery = `
            SELECT
                p.id,
                p.name,
                p.description,
                p.price,
                p.stock,
                p.image_url,
                pc.category_name,
                p.category as category_id
            FROM
                public.products AS p
            JOIN
                public.product_category AS pc ON p.category = pc.id
            WHERE
                p.name ILIKE $1 OR p.description ILIKE $1
            ORDER BY p.name;
        `;
        // ILIKE es para búsqueda case-insensitive en PostgreSQL
        // %${query}% busca el término en cualquier parte del nombre o descripción
        const { rows } = await pool.query(searchQuery, [`%${query}%`]);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error al buscar productos:', error);
        res.status(500).json({ message: 'Error interno del servidor al buscar productos.' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query('SELECT * FROM public.products WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error(`Error al obtener el producto ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

router.put('/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, category } = req.body;

    try {
        // 1. Obtener producto actual para saber la URL de la imagen vieja
        const currentProductResult = await pool.query('SELECT image_url FROM public.products WHERE id = $1', [id]);
        const currentImageUrl = currentProductResult.rows[0]?.image_url;

        let newImageUrl = currentImageUrl; // Por defecto, mantenemos la imagen actual

        // 2. Si se subió una imagen nueva...
        if (req.file) {
            try {
                newImageUrl = await uploadToGCS(req.file); // Sube la nueva imagen a GCS

                // Y si había una imagen antigua de GCS, la eliminamos
                if (currentImageUrl) {
                    await deleteFromGCS(currentImageUrl);
                }
            } catch (uploadError) {
                console.error('Error al subir nueva imagen a GCS para actualizar:', uploadError);
                return res.status(500).json({ message: 'Error al subir la nueva imagen.' });
            }
        }

        // 3. Actualizar el producto en la base de datos
        const updateQuery = `
            UPDATE public.products
            SET name = $1, description = $2, price = $3, stock = $4, category = $5, image_url = $6
            WHERE id = $7
            RETURNING *;
        `;
        const values = [name, description, parseFloat(price), parseInt(stock), parseInt(category), newImageUrl, id];

        const { rows } = await pool.query(updateQuery, values);

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error(`Error al actualizar el producto ${id} en la BD:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect(); // Obtiene un cliente para la transacción

    let productToDelete;

    try {
        // 1. Obtener el producto que se va a eliminar.
        const productResult = await client.query('SELECT * FROM public.products WHERE id = $1', [id]);
        if (productResult.rows.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        productToDelete = productResult.rows[0];

        // Iniciar la transacción de la base de datos
        await client.query('BEGIN');

        // 2. Eliminar el producto de la tabla principal
        await client.query('DELETE FROM public.products WHERE id = $1', [id]);

        // 3. Insertar el producto en la tabla de borrados (histórico)
        const insertDeletedQuery = `
            INSERT INTO public.products_deleted (id, name, description, price, stock, image_url, category, promotion_active, discount)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `;
        await client.query(insertDeletedQuery, [
            productToDelete.id,
            productToDelete.name,
            productToDelete.description,
            productToDelete.price,
            productToDelete.stock,
            productToDelete.image_url,
            productToDelete.category,
            productToDelete.promotion_active,
            productToDelete.discount
        ]);

        // 4. Si todo fue bien en la BD, confirmar la transacción
        await client.query('COMMIT');

        // 5. Después de que la transacción de la BD sea exitosa,
        // elimina la imagen de Google Cloud Storage
        if (productToDelete.image_url) {
            await deleteFromGCS(productToDelete.image_url);
        }

        res.status(200).json({ message: 'Producto eliminado y archivado correctamente.' });

    } catch (error) {
        // Si la transacción se inició y algo falló, hacer rollback
        if (client) {
            console.log("Ocurrió un error en la transacción, haciendo ROLLBACK...");
            await client.query('ROLLBACK');
        }
        console.error('Error al eliminar el producto (transacción DB/GCS):', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el producto.' });
    } finally {
        // Siempre liberar el cliente de la pool, sin importar el resultado
        if (client) {
            client.release();
        }
    }
});

module.exports = router;