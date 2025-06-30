
const Enfrentamientos = require('../models/Enfrentamientos');
const enfrentamientosService = require('../services/enfrentamientos.service');

class EnfrentamientosController {

    async generarPrimerEnfrentamiento(req, res) {
        const { torneoId } = req.params;

        try {
            const torneo = await enfrentamientosService.verificarTorneoActivo(torneoId);
            const jugadores = await enfrentamientosService.obtenerJugadoresAleatorios(torneoId);
            await enfrentamientosService.crearEnfrentamientosIniciales(torneoId, jugadores);

            res.json({ mensaje: 'Primeros enfrentamientos generados' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ mensaje: 'Hubo un error al generar los enfrentamientos' });
        }
    }

    async registrarResultadoIndividual(req, res) {
        const torneoId = parseInt(req.params.torneoId);
        const enfrentamientoId = parseInt(req.params.enfrentamientoId);
        const { ganadorId, empate = false } = req.body;

        try {
            const resultado = await enfrentamientosService.procesarResultado(torneoId, {
                enfrentamientoId,
                ganadorId,
                empate
            });

            res.json(resultado);
        } catch (error) {
            console.error(error);
            res.status(500).json({ mensaje: 'Error al procesar el resultado individual' });
        }
    }

    async registrarResultados(req, res) {
        const torneoId = parseInt(req.params.torneoId);
        const resultados = req.body.resultados;

        if (!Array.isArray(resultados)) {
            return res.status(400).json({ mensaje: 'El cuerpo debe contener un array llamado "resultados"' });
        }

        try {
            const resultadosProcesados = await Promise.all(
                resultados.map(resultado => enfrentamientosService.procesarResultado(torneoId, resultado))
            );

            res.json({ mensaje: 'Resultados procesados', resultados: resultadosProcesados });
        } catch (error) {
            console.error(error);
            res.status(500).json({ mensaje: 'Error interno al procesar resultados' });
        }
    }

    async generarSiguienteRonda(req, res) {
        const torneoId = parseInt(req.params.torneoId);

        try {
            const enfrentamientosPrevios = await enfrentamientosService.obtenerEnfrentamientosPrevios(torneoId);
            const jugadores = await enfrentamientosService.obtenerJugadoresOrdenadosPorVictorias(torneoId, enfrentamientosPrevios);
            const siguienteRonda = await enfrentamientosService.calcularSiguienteRonda(torneoId);

            const nuevosEnfrentamientos = await enfrentamientosService.generarNuevosEnfrentamientos(
                torneoId,
                jugadores,
                siguienteRonda,
                enfrentamientosPrevios
            );

            await Enfrentamientos.bulkCreate(nuevosEnfrentamientos);
            res.json({ mensaje: 'Siguiente ronda generada' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ mensaje: 'Hubo un error al generar la siguiente ronda' });
        }
    }

    async listarEnfrentamientosPorRonda(req, res) {
        const { torneoId, ronda } = req.params;

        try {
            const enfrentamientos = await enfrentamientosService.obtenerEnfrentamientosRonda(torneoId, ronda);

            if (enfrentamientos.length === 0) {
                return res.status(404).json({ mensaje: `No hay enfrentamientos para la ronda ${ronda}` });
            }

            res.json({
                ronda: Number(ronda),
                enfrentamientos: enfrentamientosService.formatearEnfrentamientos(enfrentamientos)
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ mensaje: 'Hubo un error al listar los enfrentamientos por ronda' });
        }
    }

    async listarEnfrentamientosAgrupados(req, res) {
        const { torneoId } = req.params;

        try {
            const enfrentamientos = await enfrentamientosService.obtenerTodosEnfrentamientos(torneoId);
            const enfrentamientosPorRonda = enfrentamientosService.agruparEnfrentamientosPorRonda(enfrentamientos);
            res.json(enfrentamientosPorRonda);
        } catch (error) {
            console.log(error);
            res.status(500).json({ mensaje: 'Error al obtener enfrentamientos agrupados por ronda' });
        }
    }


    async openRound(req, res, next) {
        const { torneoId, ronda } = req.params
        try {
            await enfrentamientosService.openRound(torneoId, ronda)
            return res.status(200).json({
                message: "opened round",
            });
        } catch (error) {
            return res.status(500).json({
                message: "Error al abrir la ronda",
                error: error.message
            });
        }
    }
}

module.exports = new EnfrentamientosController();




