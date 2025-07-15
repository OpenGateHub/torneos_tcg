const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

//Middlewares
const auth = require('../middleware/auth');
const verificarAdmin = require('../middleware/verificarAdmin')
// const authOpcional = require('../middleware/authOpcional');

//Controllers
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');

// routes
const torneosRoutes = require('./torneo.routes')
const leaguesRoutes = require('./leagues.routes')
const usersRoutes = require('./users.routes')
const tournamentsRoutes = require('./tournaments.routes')
const enfrentamientosRoutes = require('./enfrentamientos.routes')
const companiesRoutes = require('./companies.routes')
const applicationRoutes = require('./application.routes')

module.exports = function () {
  //Index
  router.get('/', (req, res) => {
    res.send({
      ok:true,
      message: 'server running'
    })
  })

  router.use(torneosRoutes)
  router.use(leaguesRoutes)
  router.use(usersRoutes)
  router.use(tournamentsRoutes)
  router.use(enfrentamientosRoutes)
  router.use(companiesRoutes)
  router.use(applicationRoutes)

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

  /** AUTH */
  //Login
  router.post('/login', authController.autenticarUsuario)

  return router;
}