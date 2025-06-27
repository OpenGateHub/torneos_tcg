const Usuarios = require('../models/Usuarios.js');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const enviarEmail = require('../helpers/email.js');
const UserCompany = require('../models/UsersCompany.js');
const Company = require('../models/Company.js');
const bcrypt = require('bcrypt');

class UsuariosController {
  async crearCuenta(req, res) {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const usuario = new Usuarios(req.body);
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expiraToken = Date.now() + 3600000;

    try {
      await usuario.save();
      const urlConfirmacion = `${process.env.URL_FRONTEND}/confirmar-cuenta/${usuario.token}`;

      await enviarEmail({
        email: usuario.email,
        asunto: "Confirma tu cuenta en Torneos TCG",
        mensaje: `Para confirmar tu cuenta ingresa al siguiente enlace: \n`,
        nombreUsuario: usuario.nombre,
        url: urlConfirmacion
      });
      res.json({ mensaje: 'Usuario creado. Revisa tu correo para confirmar la cuenta.' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ mensaje: 'Hubo un error', error });
    }
  }

  async confirmarCuenta(req, res) {
    const usuario = await Usuarios.findOne({
      where: {
        token: req.params.token,
        expiraToken: { [Op.gt]: Date.now() }
      }
    });

    if (!usuario) {
      return res.status(400).json({ ok: false, mensaje: 'Token inválido o expirado' });
    }

    if (usuario.activo) {
      return res.status(400).json({ ok: false, mensaje: "Cuenta ya confirmada" });
    }

    usuario.token = null;
    usuario.expiraToken = null;
    usuario.activo = 1;
    await usuario.save();

    res.json({ ok: true, mensaje: 'Cuenta confirmada correctamente' });
  }

  async solicitarTokenRecuperacion(req, res) {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const { email } = req.body;

    try {
      const usuario = await Usuarios.findOne({ where: { email } });

      if (!usuario) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      const token = crypto.randomBytes(20).toString('hex');
      const expiraToken = Date.now() + 3600000;

      usuario.token = token;
      usuario.expiraToken = expiraToken;
      await usuario.save();

      const urlRecuperacion = `${process.env.URL_FRONTEND}/restablecer-password/${token}`;

      await enviarEmail({
        email: usuario.email,
        asunto: "Recupera tu contraseña en Torneos TCG",
        mensaje: `Para recuperar tu contraseña, ingresa al siguiente enlace:`,
        nombreUsuario: usuario.nombre,
        url: urlRecuperacion
      });

      res.json({ mensaje: 'Revisa tu correo para continuar con la recuperación de la contraseña.' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ mensaje: 'Hubo un error al procesar la solicitud', error });
    }
  }

  async reenviarConfirmacion(req, res) {
    const { token } = req.body;

    const usuario = await Usuarios.findOne({ where: { tokenConfirmacion: token } });

    if (!usuario) {
      return res.status(400).json({ mensaje: 'Token inválido o cuenta ya confirmada' });
    }

    await enviarEmail({
      email: usuario.email,
      asunto: 'Confirma tu cuenta',
      mensaje: `Click en este enlace para confirmar: ${process.env.FRONTEND_URL}/confirmar-cuenta/${usuario.tokenConfirmacion}`
    });

    res.json({ mensaje: 'Correo reenviado con éxito' });
  }

  async restablecerPassword(req, res) {
    const { token } = req.params;
    const { nuevaPassword } = req.body;

    if (nuevaPassword.length < 8) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    try {
      const usuario = await Usuarios.findOne({
        where: {
          token,
          expiraToken: { [Op.gt]: Date.now() }
        }
      });

      if (!usuario) {
        return res.status(400).json({ mensaje: 'Token inválido o expirado' });
      }

      usuario.password = nuevaPassword;
      usuario.token = null;
      usuario.expiraToken = null;
      await usuario.save();

      res.json({ mensaje: 'Contraseña actualizada exitosamente.' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ mensaje: 'Hubo un error al restablecer la contraseña', error });
    }
  }

  async obtenerPerfil(req, res) {
    try {
      const usuario = await Usuarios.findByPk(req.usuario.id, {
        attributes: ['id', 'nombre', 'last_name', 'email', 'rol', 'birthdate', 'provincia', 'dni', 'bio', 'dni', 'createdAt']
      });

      const user_company = await UserCompany.findOne({
        where: {
          user: usuario.id
        },
        include: [{
          model: Company,
          attributes: ['id', 'name', 'address', 'phone', 'email', 'coin_name', 'owner']
        }]
      });

      if (!usuario) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      res.json({ usuario, user_company });
    } catch (error) {
      console.log(error);
      res.status(500).json({ mensaje: 'Error al obtener el perfil' });
    }
  }

  async actualizarPerfil(req, res) {
    try {
      const usuario = await Usuarios.findByPk(req.usuario.id);

      if (!usuario) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      const { nombre, email, password } = req.body;

      usuario.nombre = nombre || usuario.nombre;
      usuario.email = email || usuario.email;
      usuario.password = password || usuario.password;

      await usuario.save();

      res.json({ mensaje: 'Perfil actualizado correctamente' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ mensaje: 'Error al actualizar el perfil' });
    }
  }

  async eliminarCuenta(req, res) {
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
  }

  // Obtener todos los usuarios
  async getAll(req, res) {
    const { email, provincia, dni } = req.query
    const where = {}

    if (email) {
      where.email = email;
    }

    if (provincia) {
      where.provincia = provincia;
    }

    if (dni) {
      where.dni = dni;
    }

    try {
      const users = await Usuarios.findAll({
        where,
        attributes: { exclude: ['password', 'token', 'expiraToken'] }
      });
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ message: 'Error al obtener los usuarios', error: error.message });
    }
  }

  // Obtener un usuario por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await Usuarios.findByPk(id, {
        attributes: { exclude: ['password', 'token', 'expiraToken'] }
      });

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      return res.json(user);
    } catch (error) {
      return res.status(500).json({ message: 'Error al obtener el usuario', error: error.message });
    }
  }

  // Crear un nuevo usuario
  async create(req, res) {
    try {
      const {
        email,
        nombre,
        last_name,
        password,
        birthdate,
        provincia,
        city,
        bio
      } = req.body;

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await Usuarios.create({
        email,
        nombre,
        last_name,
        password: hashedPassword,
        birthdate,
        provincia,
        city,
        bio,
        rol: 'jugador' // Por defecto todos los usuarios creados son jugadores
      });

      // Excluir datos sensibles en la respuesta
      const { password: _, token: __, expiraToken: ___, ...userResponse } = user.toJSON();

      return res.status(201).json(userResponse);
    } catch (error) {
      return res.status(500).json({ message: 'Error al crear el usuario', error: error.message });
    }
  }

  // Actualizar un usuario
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        nombre,
        last_name,
        birthdate,
        provincia,
        city,
        bio,
        dni,
      } = req.body;

      const user = await Usuarios.findByPk(id);

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      await user.update({
        nombre,
        last_name,
        birthdate,
        provincia,
        city,
        bio,
        dni
      });

      // Excluir datos sensibles en la respuesta
      const { password: _, token: __, expiraToken: ___, ...userResponse } = user.toJSON();

      return res.json(userResponse);
    } catch (error) {
      return res.status(500).json({ message: 'Error al actualizar el usuario', error: error.message });
    }
  }

  // Eliminar un usuario
  async delete(req, res) {
    try {
      const { id } = req.params;
      const user = await Usuarios.findByPk(id);

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      await user.destroy();

      return res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
      return res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
    }
  }
}

module.exports = new UsuariosController();


