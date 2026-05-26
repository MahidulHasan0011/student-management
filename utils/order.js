// imple table sorting
// const buildOrder = (queryOptions, allowedFields, defaultField = "created_at") => {
//     const sortBy = allowedFields.includes(queryOptions.sortBy)
//         ? queryOptions.sortBy
//         : defaultField;

//     const sortOrder =
//         queryOptions.sortOrder?.toUpperCase() === "ASC"
//             ? "ASC"
//             : "DESC";

//     return {
//         sortBy,
//         sortOrder,
//     };
// };

// module.exports = {
//     buildOrder,
// };


const buildOrder = (
    queryOptions,
    allowedFields,
    defaultField = "created_at"
) => {

    let sortBy;

    // ARRAY SUPPORT
    if (Array.isArray(allowedFields)) {

        sortBy = allowedFields.includes(queryOptions.sortBy)
            ? queryOptions.sortBy
            : defaultField;
    }

    // OBJECT MAPPING SUPPORT
    else {

        const sortKey = allowedFields[queryOptions.sortBy]
            ? queryOptions.sortBy
            : defaultField;

        sortBy = allowedFields[sortKey];
    }

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