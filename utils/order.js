// imple table sorting
const buildOrder = (
    queryOptions,
    allowedFields, // always Object only
    defaultField = "created_at"
) => {
    // queryOptions.sortBy যদি allowedFields এ না থাকে → default use করো
    const sortKey = allowedFields[queryOptions.sortBy]
        ? queryOptions.sortBy
        : defaultField;

    const sortBy = allowedFields[sortKey];

    const sortOrder =
        queryOptions.sortOrder?.toUpperCase() === "ASC"
            ? "ASC"
            : "DESC";

    return { sortBy, sortOrder };
};

module.exports = {
    buildOrder,
}


// const buildOrder = (
//     queryOptions,
//     allowedFields, // always Object and not Array for better flexibility (mapping support)
//     defaultField = "created_at"
// ) => {

//     let sortBy;

//     // ARRAY SUPPORT
//     if (Array.isArray(allowedFields)) {

//         sortBy = allowedFields.includes(queryOptions.sortBy)
//             ? queryOptions.sortBy
//             : defaultField;
//     }

//     // OBJECT MAPPING SUPPORT
//     else {

//         const sortKey = allowedFields[queryOptions.sortBy]
//             ? queryOptions.sortBy
//             : defaultField;

//         sortBy = allowedFields[sortKey];
//     }

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















// const allowedFields = {
//     created_at:   "st.created_at",
//     student_name: "st.full_name",
//     class_name:   "c.name"
// };

// Case 1: valid sortBy আসলে
// buildOrder({ sortBy: "student_name", sortOrder: "asc" }, allowedFields);
// sortKey = "student_name" ✅ allowedFields এ আছে
// sortBy  = "st.full_name"
// sortOrder = "ASC"

// Case 2: invalid sortBy আসলে
// buildOrder({ sortBy: "hacker", sortOrder: "desc" }, allowedFields);
// sortKey = "created_at" ← default
// sortBy  = "st.created_at"
// sortOrder = "DESC"

// Case 3: sortBy না আসলে
// buildOrder({}, allowedFields);
// sortKey = "created_at" ← default
// sortBy  = "st.created_at"
// sortOrder = "DESC"