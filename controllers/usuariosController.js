const Usuarios = require('../models/Usuarios.js');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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
    const urlConfirmacion = `${process.env.URL_BACKEND}confirmar-cuenta/${usuario.token}`;
    
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

exports.confirmarCuenta = async (req, res) => {
  const usuario = await Usuarios.findOne({
    where: {
      token: req.params.token,
      expiraToken: { [Op.gt]: Date.now() }
    }
  });

  if (!usuario) {
    return res.status(400).json({ mensaje: 'Token inválido o expirado' });
  }

  usuario.token = null;
  usuario.expiraToken = null;
  usuario.activo = 1; 
  await usuario.save();

  res.json({ mensaje: 'Cuenta confirmada correctamente' });
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

    if (password) {
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt(10);
      usuario.password = await bcrypt.hash(password, salt);
    }

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





