const Torneo = require('../models/Torneo.js');
const Usuarios = require('../models/Usuarios');
const Enfrentamientos = require('../models/Enfrentamientos');

class LeagueServices {
    constructor() {
        this.league = require('../models/Ligas.js');
    }

    async calculateLeagueTable(id) {
        try {

            // Obtener todos los torneos de la liga
            const torneos = await Torneo.findAll({
                where: { leagueId: id }
            });

            if (torneos.length === 0) {
                return []
            }

            const torneosIds = torneos.map(torneo => torneo.id);

            const enfrentamientos = await Enfrentamientos.findAll({
                where: {
                    torneoId: torneosIds,
                    finalizado: true
                },
                include: [
                    { model: Usuarios, as: 'jugador1', attributes: ['id', 'nombre'] },
                    { model: Usuarios, as: 'jugador2', attributes: ['id', 'nombre'] },
                    { model: Usuarios, as: 'ganador', attributes: ['id', 'nombre'] }
                ]
            });

            const jugadoresSet = new Set();
            enfrentamientos.forEach(enf => {
                if (enf.jugador1Id) jugadoresSet.add(enf.jugador1Id);
                if (enf.jugador2Id) jugadoresSet.add(enf.jugador2Id);
            });

            const jugadoresIds = Array.from(jugadoresSet);
            const jugadores = await Usuarios.findAll({
                where: { id: jugadoresIds },
                attributes: ['id', 'nombre']
            });

            const enfrentamientosDirectos = new Map();
            enfrentamientos.forEach(enf => {
                if (enf.jugador2Id !== null) {
                    const key = [enf.jugador1Id, enf.jugador2Id].sort().join('-');
                    enfrentamientosDirectos.set(key, {
                        ganador: enf.ganadorId,
                        jugador1: enf.jugador1Id,
                        jugador2: enf.jugador2Id
                    });
                }
            });

            const victoriasContraOponentes = new Map();
            enfrentamientos.forEach(enf => {
                if (enf.ganadorId && enf.jugador2Id !== null) {
                    if (!victoriasContraOponentes.has(enf.ganadorId)) {
                        victoriasContraOponentes.set(enf.ganadorId, new Set());
                    }
                    const perdedor = enf.ganadorId === enf.jugador1Id ? enf.jugador2Id : enf.jugador1Id;
                    victoriasContraOponentes.get(enf.ganadorId).add(perdedor);
                }
            });

            const ranking = jugadores.map(jugador => {
                const usuarioId = jugador.id;
                const nombre = jugador.nombre;

                let victorias = 0;
                let empates = 0;
                let derrotas = 0;
                let byes = 0;

                enfrentamientos.forEach(enf => {
                    const esBye = enf.jugador2Id === null;

                    if (esBye && enf.jugador1Id === usuarioId) {
                        byes++;
                    } else if (enf.ganadorId === usuarioId) {
                        victorias++;
                    } else if ((enf.jugador1Id === usuarioId || enf.jugador2Id === usuarioId) && enf.empate) {
                        empates++;
                    } else if ((enf.jugador1Id === usuarioId || enf.jugador2Id === usuarioId) && enf.ganadorId !== null && enf.ganadorId !== usuarioId) {
                        derrotas++;
                    }
                });

                const total = victorias + empates + derrotas + byes;
                const puntaje = (victorias * 3) + (empates * 1) + (byes * 1);
                const porcentajeVictorias = total > 0 ? (victorias / total * 100).toFixed(2) : '0.00';

                return {
                    jugadorId: usuarioId,
                    nombre,
                    victorias,
                    empates,
                    derrotas,
                    byes,
                    total,
                    puntaje,
                    porcentajeVictorias
                };
            });

            const resolverEmpate = (jugadorA, jugadorB) => {
                const keyDirecto = [jugadorA.jugadorId, jugadorB.jugadorId].sort().join('-');
                const enfrentamientoDirecto = enfrentamientosDirectos.get(keyDirecto);

                if (enfrentamientoDirecto) {
                    if (enfrentamientoDirecto.ganador === jugadorA.jugadorId) return -1;
                    if (enfrentamientoDirecto.ganador === jugadorB.jugadorId) return 1;
                }

                const victoriasA = victoriasContraOponentes.get(jugadorA.jugadorId) || new Set();
                const victoriasB = victoriasContraOponentes.get(jugadorB.jugadorId) || new Set();

                let fuerzaA = 0;
                let fuerzaB = 0;

                ranking.forEach((jugador, index) => {
                    const posicionInversa = ranking.length - index;
                    if (victoriasA.has(jugador.jugadorId)) fuerzaA += posicionInversa;
                    if (victoriasB.has(jugador.jugadorId)) fuerzaB += posicionInversa;
                });

                return fuerzaB - fuerzaA;
            };

            ranking.sort((a, b) => {
                // Primero por puntaje
                const difPuntaje = b.puntaje - a.puntaje;
                if (difPuntaje !== 0) return difPuntaje;

                return resolverEmpate(a, b);
            });

            const rankingFiltrado = ranking.filter(jugador => jugador.total > 0);

            return rankingFiltrado
        } catch (error) {
            return error
        }
    }
}

module.exports = LeagueServices