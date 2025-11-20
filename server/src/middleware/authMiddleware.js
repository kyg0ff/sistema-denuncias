const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // El header suele venir como: "Bearer token_largo_aqui"
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
  }

  try {
    const verificado = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = verificado; // Guardamos los datos del usuario en la petición
    next(); // Dejamos pasar a la siguiente función
  } catch (error) {
    res.status(400).json({ error: 'Token inválido' });
  }
};

module.exports = verificarToken;