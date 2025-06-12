const express = require('express');
const pool = require('../db'); 
const upload = require('../middlewares/upload');
const router = express.Router();
const fs = require('fs'); 
const path = require('path'); 

// DEFINIR LA RUTA GET /api/products/
// Esta ruta obtendrá todos los productos de la base de datos.
router.get('/', async (req, res) => {
  try {
    // MODIFICAMOS LA CONSULTA PARA UNIR LAS TABLAS
    const query = `
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.price, 
        p.stock, 
        p.image_url, 
        pc.category_name 
      FROM 
        public.products AS p
      JOIN 
        public.product_category AS pc ON p.category = pc.id
      ORDER BY 
        p.id;
    `;
    const { rows } = await pool.query(query);
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
// Usamos upload.single('image') para procesar un solo archivo que viene del campo 'image'
router.post('/', upload.single('image'), async (req, res) => {
  // Los datos del formulario de texto están en req.body
  const { name, description, price, stock, category } = req.body;

  // Si no se subió un archivo, req.file será undefined
  if (!req.file) {
    return res.status(400).json({ message: 'La imagen del producto es requerida.' });
  }

  // Construimos la URL de la imagen para guardarla en la BD
  // Esta URL es relativa a la carpeta 'public'
  const imageUrl = `/images/fotosProductos/${req.file.filename}`;

  try {
    const newProductQuery = `
      INSERT INTO public.products (name, description, price, stock, image_url, category, promotion_active, discount)
      VALUES ($1, $2, $3, $4, $5, $6, false, 0)
      RETURNING *; 
    `;
    // RETURNING * nos devuelve el producto recién creado

    const values = [name, description, parseFloat(price), parseInt(stock), imageUrl, parseInt(category)];

    const { rows } = await pool.query(newProductQuery, values);

    // Enviamos el producto creado como respuesta, con el estado 201 (Created)
    res.status(201).json(rows[0]);

  } catch (error) {
    console.error('Error al crear el producto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Aquí agregaremos más rutas (POST, PUT, DELETE) en el futuro.

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
      newImageUrl = `/images/fotosProductos/${req.file.filename}`;
      // ...borramos la imagen vieja del servidor si existía
      if (currentImageUrl) {
        const oldImagePath = path.join(__dirname, '..', 'public', currentImageUrl);
        fs.unlink(oldImagePath, err => {
          if (err) console.error("Error al borrar imagen antigua:", err);
        });
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
    console.error(`Error al actualizar el producto ${id}:`, error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Archivo: routes/products.js

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Obtener el producto que se va a eliminar
    const productResult = await client.query('SELECT * FROM public.products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      throw new Error('Producto no encontrado.');
    }
    const productToDelete = productResult.rows[0];

    // 2. Insertar el producto en la tabla de borrados
    
    // --- CORRECCIÓN 1: La consulta ahora espera parámetros del $1 al $8 ---
    const insertDeletedQuery = `
      INSERT INTO public.products_deleted (id, name, description, price, stock, image_url, category, promotion_active, discount)
      VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8);
    `;
    
    // --- CORRECCIÓN 2: El array ya no incluye el 'id' antiguo. Ahora tiene 8 valores ---
    await client.query(insertDeletedQuery, [
      productToDelete.name,
      productToDelete.description,
      productToDelete.price,
      productToDelete.stock,
      productToDelete.image_url,
      productToDelete.category,
      productToDelete.promotion_active,
      productToDelete.discount
    ]);

    // 3. Eliminar el producto de la tabla principal
    await client.query('DELETE FROM public.products WHERE id = $1', [id]);
    
    // 4. Confirmar la transacción
    await client.query('COMMIT');

    // 5. Eliminar el archivo de imagen del servidor
    if (productToDelete.image_url) {
      const imagePath = path.join(__dirname, '..', 'public', productToDelete.image_url);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error(`Error al eliminar el archivo de imagen ${imagePath}:`, err);
        }
      });
    }
    
    res.status(200).json({ message: 'Producto eliminado y archivado correctamente.' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar el producto:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
});


module.exports = router;