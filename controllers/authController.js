const Usuarios = require('../models/Usuarios');
const jwt = require('jsonwebtoken');

exports.autenticarUsuario = async (req, res) => {
  const { email, password } = req.body;

  try {
    const usuario = await Usuarios.findOne({ where: { email } });

    if (!usuario) {
      return res.status(404).json({ mensaje: 'El usuario no existe' });
    }

    const passwordValido = await usuario.validarPassword(password);
    if (!passwordValido) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    //Crear el token
    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Hubo un error en el servidor' });
  }
};
