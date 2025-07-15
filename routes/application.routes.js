const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/application.controller");



// BASIC ROUTE CONFIG
const CONTROLLER = applicationController

// Rutas públicas
router.get(`/general-ranking`, (req, res, next) => CONTROLLER.getGeneralTable(req, res, next));

module.exports = router;

