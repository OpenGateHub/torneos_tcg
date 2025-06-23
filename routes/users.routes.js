const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth");
const usersController = require("../controllers/users.controller");
const isAdmin = require("../middleware/permissions/isAdmin");

const MODULE_NAME = 'users '
const CONTROLLER = usersController

// Rutas públicas
router.get(`/${MODULE_NAME}`, CONTROLLER.getAll);
router.get(`/${MODULE_NAME}/:id`, CONTROLLER.getById);

// Rutas protegidas (requieren autenticación y ser admin)
router.post(
    `/${MODULE_NAME}`,
    authMiddleware,
    isAdmin(),
    CONTROLLER.create
);

router.put(
    `/${MODULE_NAME}/:id`,
    authMiddleware,
    isAdmin(),
    CONTROLLER.update
);

router.delete(
    `/${MODULE_NAME}/:id`,
    authMiddleware,
    isAdmin(),
    CONTROLLER.delete
);

module.exports = router;
