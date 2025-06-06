const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

//Middlewares
const auth = require('../middleware/auth');
const verificarAdmin = require('../middleware/verificarAdmin')
const authOpcional = require('../middleware/authOpcional');

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
  // reenviar token de confirmacion
  router.post('/reenviar-confirmacion', usuariosController.reenviarConfirmacion);
  //Recuperar contraseña
  router.post('/recuperar-password', usuariosController.solicitarTokenRecuperacion)
  //Recuperar contraseña
  router.put('/restablecer-password/:token', usuariosController.restablecerPassword)

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
  router.get('/admin/usuarios/:id', auth, verificarAdmin(['admin']), adminController.verUsuario);
  router.get('/admin/usuarios', auth, verificarAdmin(['admin']), adminController.listarUsuarios);
  router.delete('/admin/usuarios/:id', auth, verificarAdmin(['admin']), adminController.eliminarUsuario);
  router.put('/admin/usuarios/:id/rol', auth, verificarAdmin(['admin']), adminController.cambiarRol);

  // Gestión de torneos
  router.post('/admin/torneos', auth, verificarAdmin(['admin']), torneosController.crearTorneo);
  router.get('/admin/torneos', auth, verificarAdmin(['admin']), torneosController.listarTorneos);
  router.get('/admin/torneos/:id', auth, verificarAdmin(['admin']), torneosController.obtenerTorneo);
  router.put('/admin/torneos/:id', auth, verificarAdmin(['admin']), torneosController.actualizarTorneo);
  router.delete('/admin/torneos/:id', auth, verificarAdmin(['admin']), torneosController.eliminarTorneo);
  router.get('/admin/torneos/:id/participantes', auth, verificarAdmin(['admin']), torneosController.listarParticipantes);
  
  /** TORNEOS */
  // Ruta pública o protegida con auth solamente (opcional)
  router.get('/torneos', torneosController.listarTorneos); 
  //ruta publica para ver torneo especifico
  router.get('/torneos/:id',authOpcional, torneosController.obtenerTorneo); 
  //Inscripciones a torneo
  router.post('/torneos/:id/inscribirse', auth, torneosController.inscribirseATorneo);
  //Inscribir a usuario via admin 
  router.post('/torneos/:torneoId/inscribir-usuario/:usuarioId', auth, verificarAdmin(['admin']), torneosController.inscribirUsuario);
  //mostrar el ranking del torneo
  router.get('/torneos/:torneoId/ranking', torneosController.obtenerRanking);

  //Enfrentamientos
  // Ruta para listar enfrentamientos por ronda
  router.get('/admin/torneos/:torneoId/enfrentamientos/:ronda', enfrentamientosController.listarEnfrentamientosPorRonda);
  // Ruta para listar enfrentamientos agrupados por rondas
  router.get('/torneos/:torneoId/enfrentamientos', enfrentamientosController.listarEnfrentamientosAgrupados);
  //Generar la primera ronda de enfrentamientos
  router.post('/admin/torneos/:torneoId/generarEnfrentamientos',auth, verificarAdmin(['admin']), enfrentamientosController.generarPrimerEnfrentamiento);
  //registra los resultados de los enfrentamientos
  router.post('/admin/torneos/:torneoId/resultados',auth, verificarAdmin(['admin']), enfrentamientosController.registrarResultados);
  //registra los resultados de los enfrentamientos
  router.post('/admin/torneos/:torneoId/enfrentamientos/:enfrentamientoId/resultado',auth, verificarAdmin(['admin']), enfrentamientosController.registrarResultadoIndividual);
  //genera la siguiente ronda de enfrentamientos s
  router.post('/admin/torneos/:torneoId/siguiente-ronda',auth, verificarAdmin(['admin']), enfrentamientosController.generarSiguienteRonda);






  /** AUTH */
  //Login
  router.post('/login', authController.autenticarUsuario )

  return router;
}