const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registrarUsuario = async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  try {
    // 1. Verificar si el usuario ya existe
    const usuarioExistente = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // 2. Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insertar en la base de datos
    // NOTA: Por defecto asignamos rol 'ciudadano' si no se especifica
    const nuevoUsuario = await pool.query(
      'INSERT INTO users (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol',
      [nombre, email, passwordHash, rol || 'ciudadano']
    );

    res.status(201).json({
      mensaje: 'Usuario registrado con éxito',
      usuario: nuevoUsuario.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor al registrar' });
  }
};

const loginUsuario = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuario por email
    const resultado = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const usuario = resultado.rows[0];

    if (!usuario) {
      return res.status(400).json({ error: 'Credenciales inválidas (Email no existe)' });
    }

    // 2. Verificar contraseña (comparamos texto plano vs encriptado)
    const esCorrecta = await bcrypt.compare(password, usuario.password);
    if (!esCorrecta) {
      return res.status(400).json({ error: 'Credenciales inválidas (Contraseña incorrecta)' });
    }

    // 3. Generar el Token (JWT)
    // Incluimos el ID y el ROL en el token para usarlos después
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // El token expira en 1 hora
    );

    res.json({
      mensaje: 'Login exitoso',
      token: token,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

module.exports = { registrarUsuario, loginUsuario };