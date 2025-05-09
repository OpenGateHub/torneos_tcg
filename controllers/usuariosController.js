const Usuarios = require('../models/Usuarios.js');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const enviarEmail = require('../helpers/email.js'); 

//Crear cuenta
exports.crearCuenta = async (req,res) =>{
  // validacion de errores de express
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  //Leer datos del usuario y agregarlos al modelo
  const usuario = new Usuarios(req.body);

  //Generar token de confirmacion 
  usuario.token = crypto.randomBytes(20).toString('hex');
  usuario.expiraToken = Date.now() + 3600000; // 1 hora

  try {
    await usuario.save();
    
    //Enviar mail de confirmacion
    const urlConfirmacion = `${process.env.URL_FRONTEND}/confirmar-cuenta/${usuario.token}`;
    
    await enviarEmail({
      email: usuario.email,
      asunto: "Confirma tu cuenta en Torneos TCG",
      mensaje: `Para confirmar tu cuenta ingresa al siguiente enlace: \n ${urlConfirmacion}`
    })
    res.json({mensaje:'Usuario creado. Revisa tu correo para confirmar la cuenta.'})
    
  } catch (error) {
    console.log(error);
    res.status(500).json({mensaje:'Hubo un error',error})
  }
}
// Confirma la cuenta y elimina el token
exports.confirmarCuenta = async (req, res) => {
  const usuario = await Usuarios.findOne({
    where: {
      token: req.params.token,
      expiraToken: { [Op.gt]: Date.now() }
    }
  });

  if (!usuario) {
    return res.status(400).json({ok:false,  mensaje: 'Token inválido o expirado' });
  }

  if (usuario.activo){
    return res.status(400).json({ok:false, mensaje: "Cuenta ya confirmada"})
  }

  usuario.token = null;
  usuario.expiraToken = null;
  usuario.activo = 1; 
  await usuario.save();

  res.json({ok:true, mensaje: 'Cuenta confirmada correctamente' });
};

// Solicitar Token de Recuperación de Contraseña
exports.solicitarTokenRecuperacion = async (req, res) => {
  // Validar errores de express-validator
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { email } = req.body;

  try {
    // Buscar el usuario con el email proporcionado
    const usuario = await Usuarios.findOne({ where: { email } });

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Generar token de recuperación
    const token = crypto.randomBytes(20).toString('hex');
    const expiraToken = Date.now() + 3600000; // El token expira en 1 hora

    // Guardar el token y su fecha de expiración en el usuario
    usuario.token = token;
    usuario.expiraToken = expiraToken;
    await usuario.save();

    // Enviar el email con el enlace de recuperación
    const urlRecuperacion = `${process.env.URL_FRONTEND}/restablecer-password/${token}`;
    
    await enviarEmail({
      email: usuario.email,
      asunto: "Recupera tu contraseña en Torneos TCG",
      mensaje: `Para recuperar tu contraseña, ingresa al siguiente enlace: \n ${urlRecuperacion}`
    });

    res.json({ mensaje: 'Revisa tu correo para continuar con la recuperación de la contraseña.' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Hubo un error al procesar la solicitud', error });
  }
};

exports.reenviarConfirmacion = async (req, res) => {
  const { token } = req.body;

  const usuario = await Usuarios.findOne({ where: { tokenConfirmacion: token } });

  if (!usuario) {
    return res.status(400).json({ mensaje: 'Token inválido o cuenta ya confirmada' });
  }

  // reenviás el mismo mail (o podés generar uno nuevo)
  await enviarEmail({
    email: usuario.email,
    asunto: 'Confirma tu cuenta',
    mensaje: `Click en este enlace para confirmar: ${process.env.FRONTEND_URL}/confirmar-cuenta/${usuario.tokenConfirmacion}`
  });

  res.json({ mensaje: 'Correo reenviado con éxito' });
};


// Endpoint para cambiar la contraseña
exports.restablecerPassword = async (req, res) => {
  const { token } = req.params; 
  const { nuevaPassword } = req.body;

  // Validar que la contraseña tenga al menos 8 caracteres
  if (nuevaPassword.length < 8) {
    return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  try {
    // Buscar al usuario que tiene ese token
    const usuario = await Usuarios.findOne({
      where: {
        token,
        expiraToken: { [Op.gt]: Date.now() }
      }
    });

    if (!usuario) {
      return res.status(400).json({ mensaje: 'Token inválido o expirado' });
    }


    // Actualizar la contraseña y limpiar el token
    usuario.password = nuevaPassword;
    usuario.token = null;
    usuario.expiraToken = null;
    await usuario.save();

    res.json({ mensaje: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Hubo un error al restablecer la contraseña', error });
  }
};

exports.obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuarios.findByPk(req.usuario.id, {
      attributes: ['id', 'nombre', 'email', 'rol', 'createdAt']
    });

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({ usuario });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Error al obtener el perfil' });
  }
};


exports.actualizarPerfil = async (req, res) => {
  try {
    const usuario = await Usuarios.findByPk(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const { nombre, email, password } = req.body;

    usuario.nombre = nombre || usuario.nombre;
    usuario.email = email || usuario.email;
    usuario.password = password || usuario.password

    await usuario.save();

    res.json({ mensaje: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Error al actualizar el perfil' });
  }
};

exports.eliminarCuenta = async (req, res) => {
  try {
    const usuario = await Usuarios.findByPk(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    await usuario.destroy();
    res.json({ mensaje: 'Cuenta eliminada correctamente' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Error al eliminar la cuenta' });
  }
};





