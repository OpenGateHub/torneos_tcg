const BaseController = require("./base.controller");
const Torneo = require('../models/Torneo')

class TournamentsController extends BaseController {
    constructor() {
        super({
            model: Torneo
        })
    }

    async getAll(req, res) {
        try {
            const league = req.query.league
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            let where = {}
            if(league){
                where.leagueId = league
            }

            const { count, rows } = await this.model.findAndCountAll({
                limit,
                offset,
                order: [["id", "DESC"]],
                where
            });

            const totalPages = Math.ceil(count / limit);

            return res.json({
                data: rows,
                pagination: {
                    count,
                    itemsPerPage: limit,
                    currentPage: page,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                    nextPage: page < totalPages ? `/api/${this.model.name.toLowerCase()}?page=${page + 1}&limit=${limit}` : null,
                    previousPage: page > 1 ? `/api/${this.model.name.toLowerCase()}?page=${page - 1}&limit=${limit}` : null,
                    firstPage: `/api/${this.model.name.toLowerCase()}?page=1&limit=${limit}`,
                    lastPage: `/api/${this.model.name.toLowerCase()}?page=${totalPages}&limit=${limit}`
                }
            });
        } catch (error) {
            console.log(error)
            return res.status(500).json({
                message: 'Error al obtener los registros',
                error: error.message
            });
        }
    }

}

module.exports = new TournamentsController()
