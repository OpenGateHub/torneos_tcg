const getPaginationData = (req, count, page, limit) => {
    const totalPages = Math.ceil(count / limit);
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
    
    const buildUrl = (pageNum) => {
        const queryParams = new URLSearchParams(req.query);
        queryParams.set('page', pageNum);
        return `${baseUrl}?${queryParams.toString()}`;
    };

    return {
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
    };
};

const getPaginationOptions = (req, defaultLimit = 30) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || defaultLimit;
    const offset = (page - 1) * limit;

    return { page, limit, offset };
};

module.exports = {
    getPaginationData,
    getPaginationOptions
};