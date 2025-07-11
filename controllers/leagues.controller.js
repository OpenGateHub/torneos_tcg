const League = require('../models/Ligas');
const Company = require('../models/Company');
const Torneo = require('../models/Torneo')
const { getPaginationData, getPaginationOptions } = require('../helpers/paginationHelper');
const LeagueServices = require('../services/league.services')

class LeagueController {

    constructor() {
        this.leagueServices = new LeagueServices()
    }

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
            const { name, description, companyId, ...rest } = req.body;

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
            const result = await this.leagueServices.calculateLeagueTable(id)
            return res.json({
                results: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new LeagueController();