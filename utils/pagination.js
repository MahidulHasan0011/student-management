const buildPagination = (queryOptions) => {
    const page = parseInt(queryOptions.page) || 1;
    const limit = parseInt(queryOptions.limit) || 10;
    const offset = (page - 1) * limit;

    return {
        page,
        limit,
        offset,
    };
};

const buildPaginationMeta = (total, page, limit) => {
    return {
        total: parseInt(total),
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};

module.exports = {
    buildPagination,
    buildPaginationMeta,
};