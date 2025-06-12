// Archivo: routes/users.js

const express = require('express');
const pool = require('../db');
const router = express.Router();

// --- RUTA GET /: Obtiene todos los usuarios con el nombre de su estado ---
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.name, u.email, u.status, sa.status_name
      FROM public.users AS u
      JOIN public.status_account AS sa ON u.status = sa.status_code
      ORDER BY u.id ASC;
    `;
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// --- RUTA GET /statuses: Obtiene todos los estados de cuenta posibles ---
router.get('/statuses', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM public.status_account ORDER BY status_code');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener los estados de cuenta:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// --- RUTA PUT /:id: Actualiza un usuario ---
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  // Solo permitimos cambiar nombre, email y status
  const { name, email, status } = req.body;

  try {
    const updateQuery = `
      UPDATE public.users 
      SET name = $1, email = $2, status = $3 
      WHERE id = $4 
      RETURNING *;
    `;
    const values = [name, email, parseInt(status), id];
    const { rows } = await pool.query(updateQuery, values);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Error al actualizar el usuario ${id}:`, error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// --- RUTA DELETE /:id: Elimina un usuario ---
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleteResult = await pool.query('DELETE FROM public.users WHERE id = $1', [id]);
    // rowCount te dice cuántas filas fueron eliminadas.
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.status(200).json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    console.error(`Error al eliminar el usuario ${id}:`, error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;