const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const verificarAdmin = require('../middleware/verificarAdmin');
const enfrentamientosController = require('../controllers/enfrentamientos.controller');
const isAdmin = require('../middleware/permissions/isAdmin');

// Ruta para listar enfrentamientos por ronda
router.get('/admin/torneos/:torneoId/enfrentamientos/:ronda',
    enfrentamientosController.listarEnfrentamientosPorRonda
);

// Ruta para listar enfrentamientos agrupados por rondas
router.get('/torneos/:torneoId/enfrentamientos',
    enfrentamientosController.listarEnfrentamientosAgrupados
);

// Generar la primera ronda de enfrentamientos
router.post('/admin/torneos/:torneoId/generarEnfrentamientos',
    auth,
    verificarAdmin(['admin']),
    enfrentamientosController.generarPrimerEnfrentamiento
);

// Registra los resultados de los enfrentamientos
router.post('/admin/torneos/:torneoId/resultados',
    auth,
    verificarAdmin(['admin']),
    (req, res, next) => enfrentamientosController.registrarResultados(req, res, next)
);

// Registra los resultados de los enfrentamientos individuales
router.post('/admin/torneos/:torneoId/enfrentamientos/:enfrentamientoId/resultado',
    auth,
    verificarAdmin(['admin']),
    enfrentamientosController.registrarResultadoIndividual
);

// Genera la siguiente ronda de enfrentamientos
router.post('/admin/torneos/:torneoId/siguiente-ronda',
    auth,
    verificarAdmin(['admin']),
    (req, res, next) => enfrentamientosController.generarSiguienteRonda(req, res, next)
);

router.get('/torneos/:torneoId/ronda/:ronda',
    // auth, isAdmin(),
    (req, res, next) => enfrentamientosController.openRound(req, res, next))

module.exports = router;