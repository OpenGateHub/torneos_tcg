const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth");
const usersController = require("../controllers/users.controller");
const isAdmin = require("../middleware/permissions/isAdmin");
const { simpleValidatorCreate } = require("../validators/users.validators");
const auth = require("../middleware/auth");

const MODULE_NAME = 'users'
const CONTROLLER = usersController

// Rutas públicas
router.get(`/${MODULE_NAME}`, (req, res, next) => CONTROLLER.getAll(req, res, next));
router.get(`/${MODULE_NAME}/:id`, (req, res, next) => CONTROLLER.getById(req, res, next));

// Rutas protegidas (requieren autenticación y ser admin)
router.post(
    `/${MODULE_NAME}`,
    authMiddleware,
    isAdmin(),
    (req, res, next) => CONTROLLER.create(req, res, next)
);

router.put(
    `/${MODULE_NAME}/:id`,
    authMiddleware,
    (req, res, next) => CONTROLLER.update(req, res, next)
);

router.delete(
    `/${MODULE_NAME}/:id`,
    authMiddleware,
    isAdmin(),
    (req, res, next) => CONTROLLER.delete(req, res, next)
);



/** USUARIOS */
//Crear Usuario
router.post('/crear-cuenta', simpleValidatorCreate, (req, res, next) => CONTROLLER.crearCuenta(req, res, next));

//Confirmar cuenta
router.get('/confirmar-cuenta/:token', (req, res) => CONTROLLER.confirmarCuenta(req, res));

// reenviar token de confirmacion
router.post('/reenviar-confirmacion', (req, res) => CONTROLLER.reenviarConfirmacion(req, res));

//Recuperar contraseña
router.post('/recuperar-password', (req, res) => CONTROLLER.solicitarTokenRecuperacion(req, res));

//Recuperar contraseña
router.put('/restablecer-password/:token', (req, res) => CONTROLLER.restablecerPassword(req, res));

// Ver perfil del usuario autenticado
router.get('/perfil', auth, (req, res) => CONTROLLER.obtenerPerfil(req, res));

// Actualizar perfil
router.put('/perfil', auth, (req, res) => CONTROLLER.actualizarPerfil(req, res));

// Eliminar cuenta
router.delete('/perfil', auth, (req, res) => CONTROLLER.eliminarCuenta(req, res));

module.exports = router;
