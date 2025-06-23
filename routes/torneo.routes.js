const torneosController = require("../controllers/torneosController");
const express = require("express");

const authOpcional = require("../middleware/authOpcional");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const verificarAdmin = require("../middleware/verificarAdmin");

// Gestión de torneos
router.post(
    "/admin/torneos",
    authMiddleware,
    verificarAdmin(["admin"]),
    torneosController.crearTorneo
);
router.get(
    "/admin/torneos",
    authMiddleware,
    verificarAdmin(["admin"]),
    torneosController.listarTorneos
);
router.get(
    "/admin/torneos/:id",
    authMiddleware,
    verificarAdmin(["admin"]),
    torneosController.obtenerTorneo
);
router.put(
    "/admin/torneos/:id",
    authMiddleware,
    verificarAdmin(["admin"]),
    torneosController.actualizarTorneo
);
router.delete(
    "/admin/torneos/:id",
    authMiddleware,
    verificarAdmin(["admin"]),
    torneosController.eliminarTorneo
);
router.get(
    "/admin/torneos/:id/participantes",
    authMiddleware,
    verificarAdmin(["admin"]),
    torneosController.listarParticipantes
);

/** TORNEOS */
// Ruta pública o protegida con auth solamente (opcional)
router.get("/torneos", torneosController.listarTorneos);
//ruta publica para ver torneo especifico
router.get("/torneos/:id", authOpcional, torneosController.obtenerTorneo);
//Inscripciones a torneo
router.post(
    "/torneos/:id/inscribirse",
    authMiddleware,
    torneosController.inscribirseATorneo
);
//Inscribir a usuario via admin
router.post(
    "/torneos/:torneoId/inscribir-usuario/:usuarioId",
    authMiddleware,
    verificarAdmin(["admin"]),
    torneosController.inscribirUsuario
);
//mostrar el ranking del torneo
router.get("/torneos/:torneoId/ranking", torneosController.obtenerRanking);

module.exports = router;
