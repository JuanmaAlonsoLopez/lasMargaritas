// Archivo: routes/users.js

const express = require('express');
const pool = require('../db');
const router = express.Router();

// --- RUTA GET /: Obtiene todos los usuarios con el nombre de su ROL ---
router.get('/', async (req, res) => {
  try {
    // CAMBIO: Hacemos JOIN con user_role usando la columna "role"
    const query = `
      SELECT u.id, u.name, u.email, u.role, ur.role_name
      FROM public.users AS u
      JOIN public.user_role AS ur ON u.role = ur.id
      ORDER BY u.id ASC;
    `;
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// --- RUTA GET /roles: Obtiene todos los roles posibles ---
// CAMBIO: Antes se llamaba /statuses
router.get('/roles', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM public.user_role ORDER BY id');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener los roles:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// --- RUTA PUT /:id: Actualiza un usuario ---
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  // CAMBIO: Ahora recibimos "role" en lugar de "status"
  const { name, email, role } = req.body;

  try {
    // CAMBIO: Actualizamos la columna "role"
    const updateQuery = `
      UPDATE public.users 
      SET name = $1, email = $2, role = $3 
      WHERE id = $4 
      RETURNING *;
    `;
    const values = [name, email, parseInt(role), id];
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

// --- RUTA DELETE /:id: Elimina un usuario (SIN CAMBIOS) ---
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleteResult = await pool.query('DELETE FROM public.users WHERE id = $1', [id]);
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