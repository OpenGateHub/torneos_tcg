const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth");
const usersController = require("../controllers/users.controller");
const isAdmin = require("../middleware/permissions/isAdmin");

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
    isAdmin(),
    (req, res, next) => CONTROLLER.update(req, res, next)
);

router.delete(
    `/${MODULE_NAME}/:id`,
    authMiddleware,
    isAdmin(),
    (req, res, next) => CONTROLLER.delete(req, res, next)
);

module.exports = router;
