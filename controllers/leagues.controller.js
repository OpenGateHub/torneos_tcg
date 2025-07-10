const League = require('../models/Ligas');
const Company = require('../models/Company');
const Torneo = require('../models/Torneo')
const Usuarios = require('../models/Usuarios')
const Enfrentamientos = require('../models/Enfrentamientos')
const { getPaginationData, getPaginationOptions } = require('../helpers/paginationHelper');

class LeagueController {
    async getAll(req, res) {
        try {
            const { company_id } = req.query;
            const { page, limit, offset } = getPaginationOptions(req);

            const where = {};
            if (company_id) {
                where.companyId = company_id;
            }

            const queryOptions = {
                where,
                limit,
                offset,
                include: [{
                    model: Company,
                    as: 'company'
                }],
                order: [['createdAt', 'DESC']]
            };

            const { count, rows: leagues } = await League.findAndCountAll(queryOptions);

            return res.json({
                data: leagues,
                pagination: getPaginationData(req, count, page, limit)
            });
        } catch (error) {
            return res.status(500).json({ message: 'Error al obtener las ligas', error: error.message });
        }
    }

    // Obtener una liga por ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const league = await League.findByPk(id, {
                include: [{
                    model: Company,
                    as: 'company'
                }]
            });

            if (!league) {
                return res.status(404).json({ message: 'Liga no encontrada' });
            }

            return res.json(league);
        } catch (error) {
            return res.status(500).json({ message: 'Error al obtener la liga', error: error.message });
        }
    }

    // Crear una nueva liga
    async create(req, res) {
        try {
            const { name, description, companyId, startDate, endDate, firstPlacePrize, secondPlacePrize, thirdPlacePrize } = req.body;

            const league = await League.create({
                name,
                description,
                companyId,
                startDate,
                endDate,
                firstPlacePrize,
                secondPlacePrize,
                thirdPlacePrize
            });

            return res.status(201).json(league);
        } catch (error) {
            return res.status(500).json({ message: 'Error al crear la liga', error: error.message });
        }
    }

    // Actualizar una liga
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description, companyId , ...rest} = req.body;

            const league = await League.findByPk(id);

            if (!league) {
                return res.status(404).json({ message: 'Liga no encontrada' });
            }

            await league.update({
                name,
                description,
                companyId,
                rest
            });

            return res.json(league);
        } catch (error) {
            return res.status(500).json({ message: 'Error al actualizar la liga', error: error.message });
        }
    }

    // Eliminar una liga
    async delete(req, res) {
        try {
            const { id } = req.params;
            const league = await League.findByPk(id);

            if (!league) {
                return res.status(404).json({ message: 'Liga no encontrada' });
            }

            await league.destroy();

            return res.json({ message: 'Liga eliminada correctamente' });
        } catch (error) {
            return res.status(500).json({ message: 'Error al eliminar la liga', error: error.message });
        }
    }

    async addTorneo(req, res) {
        try {
            const { id } = req.params; // ID de la liga
            const { torneoId } = req.body; // ID del torneo a asignar

            // Verificar que la liga existe
            const league = await League.findByPk(id);
            if (!league) {
                return res.status(404).json({ message: 'Liga no encontrada' });
            }

            // Actualizar el torneo con el leagueId
            const torneo = await Torneo.findByPk(torneoId);
            if (!torneo) {
                return res.status(404).json({ message: 'Torneo no encontrado' });
            }

            await torneo.update({ leagueId: id });

            return res.json({
                message: 'Torneo asignado correctamente a la liga',
                torneo
            });
        } catch (error) {
            return res.status(500).json({
                message: 'Error al asignar el torneo a la liga',
                error: error.message
            });
        }
    }

    async listTorneosSinLigas(req, res) {
        try {
            const torneos = await Torneo.findAll({
                where: {
                    leagueId: null
                }
            });
            return res.json(torneos);
        } catch (error) {
            return res.status(500).json({ message: 'Error al obtener los torneos sin ligas', error: error.message });
        }
    }


    async leagueTable(req, res, next) {
        try {
            const { id } = req.params;
            
            // Obtener todos los torneos de la liga
            const torneos = await Torneo.findAll({
                where: { leagueId: id }
            });
            
            if (torneos.length === 0) {
                return res.json([]);
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
            
            return res.json(rankingFiltrado);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new LeagueController();