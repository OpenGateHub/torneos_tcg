const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

//Middlewares
const auth = require('../middleware/auth');
const verificarAdmin = require('../middleware/verificarAdmin')

//Controllers
const usuariosController = require('../controllers/usuariosController');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');

module.exports = function(){
  //Index
  router.get('/', (req,res)=>{
    res.send("Servidor funcionando, torneito de cartulis")
  })
  
  /** USUARIOS */
  //Crear Usuario
  router.post('/crear-cuenta',[
    body('email').isEmail().withMessage('El correo no es válido'),
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
  ], usuariosController.crearCuenta);

  //Confirmar cuenta
  router.get('/confirmar-cuenta/:token', usuariosController.confirmarCuenta)

  // Ver perfil del usuario autenticado
router.get('/perfil', auth, usuariosController.obtenerPerfil);

  // Actualizar perfil
  router.put('/perfil', auth, usuariosController.actualizarPerfil);

  // Eliminar cuenta
  router.delete('/perfil', auth, usuariosController.eliminarCuenta);

  /** ADMIN */
  //prueba de acceso administrador
  router.get('/admin',
    auth, 
    verificarAdmin(['admin']), 
    adminController.chequearPermisos);
  // Gestión de usuarios
  router.get('/admin/:id', auth, verificarAdmin(['admin']), adminController.verUsuario);
  router.get('/admin/usuarios', auth, verificarAdmin(['admin']), adminController.listarUsuarios);
  router.delete('/admin/usuarios/:id', auth, verificarAdmin(['admin']), adminController.eliminarUsuario);
  router.put('/admin/usuarios/:id/rol', auth, verificarAdmin(['admin']), adminController.cambiarRol);

  // Gestión de torneos TODO!
  router.post('/admin/torneos', auth, verificarAdmin(['admin']), adminController.crearTorneo);
  router.get('/admin/torneos', auth, verificarAdmin(['admin']), adminController.listarTorneos);
  router.put('/admin/torneos/:id', auth, verificarAdmin(['admin']), adminController.editarTorneo);
  router.delete('/admin/torneos/:id', auth, verificarAdmin(['admin']), adminController.eliminarTorneo);


  /** AUTH */
  //Login
  router.post('/login', authController.autenticarUsuario )

  return router;
}