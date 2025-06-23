const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth");
const controller = require("../controllers/tournaments.controller");
const isAdmin = require("../middleware/permissions/isAdmin");

const MODULE_NAME = 'tournaments'
const CONTROLLER = controller

// Rutas públicas
router.get(`/${MODULE_NAME}`, (req, res) => CONTROLLER.getAll(req, res));
router.get(`/${MODULE_NAME}/:id`, (req, res) => CONTROLLER.getById(req, res));

// Rutas protegidas (requieren autenticación y ser admin)
router.post(
    `/${MODULE_NAME}`,
    authMiddleware,
    isAdmin(),
    (req, res) => CONTROLLER.create(req, res)
);

router.put(
    `/${MODULE_NAME}/:id`,
    authMiddleware,
    isAdmin(),
    (req, res) => CONTROLLER.update(req, res)
);

router.delete(
    `/${MODULE_NAME}/:id`,
    authMiddleware,
    isAdmin(),
    (req, res) => CONTROLLER.delete(req, res)
);

module.exports = router;
