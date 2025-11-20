const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verificarToken = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de Multer (Dónde guardar las fotos)
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'denuncias_app', // Nombre de la carpeta en la nube
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

const upload = multer({ storage: storage });

// RUTA: Crear Denuncia (POST /api/reports)
// Nota el orden: 1. Verificar Token, 2. Subir Imagen, 3. Lógica
router.post('/', verificarToken, upload.single('foto'), async (req, res) => {
  const { latitud, longitud, descripcion, direccion } = req.body;
  const usuario_id = req.usuario.id; // Lo sacamos del token
  
  // Si subió foto, guardamos la ruta. Si no, null.
  // IMPORTANTE: Guardamos la ruta relativa para poder servirla después
  const foto_url = req.file ? req.file.path : null;

  try {
    const nuevaDenuncia = await pool.query(
      `INSERT INTO reports (user_id, latitud, longitud, descripcion, direccion, foto_url) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [usuario_id, latitud, longitud, descripcion, direccion, foto_url]
    );

    res.status(201).json(nuevaDenuncia.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la denuncia' });
  }
});

// RUTA: Obtener mis denuncias (GET /api/reports/mis-denuncias)
router.get('/mis-denuncias', verificarToken, async (req, res) => {
    try {
        const denuncias = await pool.query('SELECT * FROM reports WHERE user_id = $1 ORDER BY fecha_creacion DESC', [req.usuario.id]);
        res.json(denuncias.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener denuncias' });
    }
});

// RUTA ADMIN: Obtener TODAS las denuncias
router.get('/admin/todas', verificarToken, async (req, res) => {
    if (req.usuario.rol !== 'autoridad') {
        return res.status(403).json({ error: 'Acceso denegado. Solo autoridades.' });
    }

    try {
        // Traemos también el nombre del ciudadano que reportó (JOIN)
        const denuncias = await pool.query(`
            SELECT reports.*, users.nombre as ciudadano_nombre 
            FROM reports 
            JOIN users ON reports.user_id = users.id 
            ORDER BY fecha_creacion DESC
        `);
        res.json(denuncias.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener denuncias' });
    }
});

// RUTA ADMIN: Cambiar estado (Resolver/Rechazar)
router.patch('/:id/estado', verificarToken, async (req, res) => {
    if (req.usuario.rol !== 'autoridad') {
        return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const { id } = req.params;
    const { estado } = req.body; // Esperamos recibir: "resuelto", "rechazado", etc.

    try {
        const actualizado = await pool.query(
            'UPDATE reports SET estado = $1 WHERE id = $2 RETURNING *',
            [estado, id]
        );
        res.json(actualizado.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
});

// RUTA ADMIN: Obtener estadísticas (Conteo por estado)
router.get('/admin/stats', verificarToken, async (req, res) => {
    if (req.usuario.rol !== 'autoridad') {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    try {
        // Consulta SQL mágica: Agrupa por estado y cuenta cuántos hay
        const estadisticas = await pool.query(`
            SELECT estado, COUNT(*) as total 
            FROM reports 
            GROUP BY estado
        `);
        
        res.json(estadisticas.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

module.exports = router;