const paginate = (model, options = {}) => {
    return async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 30;
            const offset = (page - 1) * limit;

            // Merge default options with custom options
            const queryOptions = {
                limit,
                offset,
                order: [['createdAt', 'DESC']],
                ...options
            };

            const { count, rows: results } = await model.findAndCountAll(queryOptions);
            const totalPages = Math.ceil(count / limit);

            // Construir URLs para navegación
            const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
            
            // Función para construir URL con query params
            const buildUrl = (pageNum) => {
                const queryParams = new URLSearchParams(req.query);
                queryParams.set('page', pageNum);
                return `${baseUrl}?${queryParams.toString()}`;
            };

            // Agregar datos de paginación al request
            req.pagination = {
                results,
                pagination: {
                    count,
                    totalPages,
                    currentPage: page,
                    itemsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                    nextPage: page < totalPages ? buildUrl(page + 1) : null,
                    previousPage: page > 1 ? buildUrl(page - 1) : null,
                    firstPage: buildUrl(1),
                    lastPage: buildUrl(totalPages)
                }
            };

            next();
        } catch (error) {
            res.status(500).json({
                message: 'Error en la paginación',
                error: error.message
            });
        }
    };
};

module.exports = paginate;