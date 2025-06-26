const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth");
const verificarAdmin = require("../middleware/verificarAdmin");
const leaguesController = require("../controllers/leagues.controller");
const { createLeagueValidator, updateLeagueValidator } = require("../validators/leagues.validators");
const { validateResult } = require("../helpers/validateHelper");

const MODULE_NAME = 'leagues'
const CONTROLLER = leaguesController

// Rutas públicas
router.get(`/${MODULE_NAME}`, (req, res, next) => CONTROLLER.getAll(req, res, next));
router.get(`/${MODULE_NAME}/:id`, (req, res, next) => CONTROLLER.getById(req, res, next));

// Rutas protegidas (requieren autenticación y ser admin)
router.post(
    `/${MODULE_NAME}`,
    authMiddleware,
    verificarAdmin(["admin"]),
    createLeagueValidator,
    validateResult,
    (req, res, next) => CONTROLLER.create(req, res, next)
);

router.put(
    `/${MODULE_NAME}/:id`,
    authMiddleware,
    verificarAdmin(["admin"]),
    updateLeagueValidator,
    validateResult,
    (req, res, next) => CONTROLLER.update(req, res, next)
);

router.delete(
    `/${MODULE_NAME}/:id`,
    authMiddleware,
    verificarAdmin(["admin"]),
    (req, res, next) => CONTROLLER.delete(req, res, next)
);

module.exports = router;
