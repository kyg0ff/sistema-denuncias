const path = require('path');
const reportRoutes = require('./src/routes/reportRoutes');
const express = require('express');
const cors = require('cors');
const pool = require('./src/config/db'); // Importamos la conexión
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares (Para que el servidor entienda JSON y permita conexiones externas)
const authRoutes = require('./src/routes/authRoutes');
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// Ruta de prueba inicial
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', async (req, res) => {
  try {
    // Hacemos una consulta simple para verificar que la DB responde
    const resultado = await pool.query('SELECT NOW()');
    res.json({
      mensaje: '¡Servidor funcionando correctamente! 🚀',
      hora_servidor: resultado.rows[0].now
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al conectar con la base de datos' });
  }
});

// Arrancar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});