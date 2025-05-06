const Usuarios = require('../models/Usuarios.js');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const enviarEmail = require('../helpers/email.js'); 


//Gestion de Usuarios
exports.chequearPermisos = (req, res) => {
  res.json({ msj: "Acceso validado como administrador" });
};

exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuarios.findAll({
      attributes:{ exclude:['password', 'token', 'expiraToken']}
    });
    res.json(usuarios);
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Error al obtener los usuarios' });
  }
};

exports.verUsuario = async (req, res) => {
  try {
    const usuario = await Usuarios.findByPk(req.params.id,{
      attributes:{ exclude:['password', 'token', 'expiraToken']}
    });

    if(!usuario){
      return res.json({mensaje:"Usuario no encontrado en la base de datos"})
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener los usuarios' });
  }
};

exports.cambiarRol = async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await Usuarios.findByPk(id);

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Cambiar el rol: si es jugador pasa a admin, si es admin pasa a jugador
    usuario.rol = usuario.rol === 'jugador' ? 'admin' : 'jugador';
    await usuario.save();

    res.json({ mensaje: `El Rol de ${usuario.nombre} cambiado a ${usuario.rol}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Hubo un error al cambiar el rol' });
  }
};


exports.eliminarUsuario = async (req,res) =>{
  try {
    const usuario = await Usuarios.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    await usuario.destroy();
    res.json({mensaje:"Usuario eliminado correctamente"});
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener los usuarios' });
  }
}

//TODO paginacion de usuarios, filtros de usuario, buscar usuario


