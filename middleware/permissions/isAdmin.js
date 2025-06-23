// Middleware para verificar si el usuario es administrador
module.exports = () => {
    return (req, res, next) => {
      // Verificamos si el usuario tiene un rol válido y permitido
      const { rol } = req.usuario; // El rol viene del JWT que hemos añadido al request
  
      if (rol === 'admin') {
        return res.status(403).json({ mensaje: 'Acceso denegado: No tienes permisos' });
      }
  
      next(); // Si el rol es válido, continua a la siguiente función
    };
  };
  