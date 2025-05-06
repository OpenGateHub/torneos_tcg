const jwt = require('jsonwebtoken');
const Usuarios = require('../models/Usuarios');

const authOpcional = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const usuario = await Usuarios.findByPk(decoded.id);
      if (usuario) {
        req.usuario = usuario;
      }
    } catch (err) {
      // Token inválido, simplemente no ponemos req.usuario
    }
  }

  next();
};

module.exports = authOpcional;
