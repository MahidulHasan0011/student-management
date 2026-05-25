const buildOrder = (queryOptions, allowedFields, defaultField = "created_at") => {
    const sortBy = allowedFields.includes(queryOptions.sortBy)
        ? queryOptions.sortBy
        : defaultField;

    const sortOrder =
        queryOptions.sortOrder?.toUpperCase() === "ASC"
            ? "ASC"
            : "DESC";

    return {
        sortBy,
        sortOrder,
    };
};

module.exports = {
    buildOrder,
};