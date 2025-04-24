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
const torneosController = require('../controllers/torneosController');
const enfrentamientosController = require('../controllers/enfrentamientosController');

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
  router.post('/admin/torneos', auth, verificarAdmin(['admin']), torneosController.crearTorneo);
  router.get('/admin/torneos', auth, verificarAdmin(['admin']), torneosController.listarTorneos);
  router.put('/admin/torneos/:id', auth, verificarAdmin(['admin']), torneosController.actualizarTorneo);
  router.delete('/admin/torneos/:id', auth, verificarAdmin(['admin']), torneosController.eliminarTorneo);
  router.get('/admin/torneos/:id/participantes', auth, verificarAdmin(['admin']), torneosController.listarParticipantes);
  
  /** TORNEOS */
  // Ruta pública o protegida con auth solamente (opcional)
  router.get('/torneos', auth, torneosController.listarTorneos); 
  //Inscripciones a torneo
  router.post('/torneos/:id/inscribirse', auth, torneosController.inscribirseATorneo);
  //mostrar el ranking del torneo
  router.get('/torneos/:torneoId/ranking', torneosController.obtenerRanking);

  //Enfrentamientos
  // Ruta para listar enfrentamientos por ronda
  router.get('/admin/torneos/:torneoId/enfrentamientos/:ronda', enfrentamientosController.listarEnfrentamientosPorRonda);
  // Ruta para listar enfrentamientos agrupados por rondas
  router.get('/admin/torneos/:torneoId/enfrentamientos', enfrentamientosController.listarEnfrentamientosAgrupados);
  //Generar la primera ronda de enfrentamientos
  router.post('/admin/torneos/:torneoId/generarEnfrentamientos',auth, verificarAdmin(['admin']), enfrentamientosController.generarPrimerEnfrentamiento);
  //registra los resultados de los enfrentamientos
  router.post('/admin/torneos/:torneoId/resultados',auth, verificarAdmin(['admin']), enfrentamientosController.registrarResultados);
  //genera la siguiente ronda de enfrentamientos //TODO unificar el registro de resultados con la generacion de la siguiente ronda.
  router.post('/admin/torneos/:torneoId/siguiente-ronda',auth, verificarAdmin(['admin']), enfrentamientosController.generarSiguienteRonda);






  /** AUTH */
  //Login
  router.post('/login', authController.autenticarUsuario )

  return router;
}