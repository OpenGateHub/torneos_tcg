const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth");
const verificarAdmin = require("../middleware/verificarAdmin");
const leaguesController = require("../controllers/leagues.controller");

// Rutas públicas
router.get("/leagues", leaguesController.getAll);
router.get("/leagues/:id", leaguesController.getById);

// Rutas protegidas (requieren autenticación y ser admin)
router.post(
    "/leagues",
    authMiddleware,
    verificarAdmin(["admin"]),
    leaguesController.create
);

router.put(
    "/leagues/:id",
    authMiddleware,
    verificarAdmin(["admin"]),
    leaguesController.update
);

router.delete(
    "/leagues/:id",
    authMiddleware,
    verificarAdmin(["admin"]),
    leaguesController.delete
);

module.exports = router;
