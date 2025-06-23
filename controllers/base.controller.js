class BaseController {
    constructor({ model }) {
        this.model = model;
    }

    // Obtener todos los registros con paginación
    async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const { count, rows } = await this.model.findAndCountAll({
                limit,
                offset,
                order: [["id", "DESC"]]
            });

            const totalPages = Math.ceil(count / limit);

            return res.json({
                data: rows,
                pagination: {
                    totalItems: count,
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

    // Obtener un registro por ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const item = await this.model.findByPk(id);

            if (!item) {
                return res.status(404).json({
                    message: 'Registro no encontrado'
                });
            }

            return res.json(item);
        } catch (error) {
            console.log(error)
            return res.status(500).json({
                message: 'Error al obtener el registro',
                error: error.message
            });
        }
    }

    // Crear un nuevo registro
    async create(req, res) {
        try {
            const item = await this.model.create(req.body);
            return res.status(201).json(item);
        } catch (error) {
            return res.status(500).json({
                message: 'Error al crear el registro',
                error: error.message
            });
        }
    }

    // Actualizar un registro
    async update(req, res) {
        try {
            const { id } = req.params;
            const item = await this.model.findByPk(id);

            if (!item) {
                return res.status(404).json({
                    message: 'Registro no encontrado'
                });
            }

            await item.update(req.body);
            return res.json(item);
        } catch (error) {
            return res.status(500).json({
                message: 'Error al actualizar el registro',
                error: error.message
            });
        }
    }

    // Eliminar un registro
    async delete(req, res) {
        try {
            const { id } = req.params;
            const item = await this.model.findByPk(id);

            if (!item) {
                return res.status(404).json({
                    message: 'Registro no encontrado'
                });
            }

            await item.destroy();
            return res.json({
                message: 'Registro eliminado correctamente'
            });
        } catch (error) {
            return res.status(500).json({
                message: 'Error al eliminar el registro',
                error: error.message
            });
        }
    }
}

module.exports = BaseController;