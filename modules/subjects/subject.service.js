const db = require("../../config/db");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const createSubject = async (data) => {
    const query = `INSERT INTO subjects (name, code) VALUES ($1, $2) RETURNING *`;
    const values = [data.name, data.code];
    const result = await db.query(query, values);
    return result.rows[0];
};
const getAllSubjects = async (queryOptions) => {


 // pagination
    const { page, limit, offset } =
        buildPagination(queryOptions);

    // sorting
    const { sortBy, sortOrder } =
        buildOrder(queryOptions, {
            created_at: "sub.created_at",
            subject_name: "sub.name",
            subject_code: "sub.code"
        });

    const values = [];
    const countRef = { value: 1 };

    const config = {
        searchableColumns: [
            "sub.name",
            "sub.code"
        ],

        filterableColumns: [
            "sub.code"
        ]
    };

    const whereClause = buildWhereClause(
        queryOptions,
        values,
        config,
        countRef,
        "sub"
    );

    // MAIN QUERY
    const query = `
        SELECT *
        FROM subjects sub
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    values.push(limit, offset);

    const result = await db.query(query, values);

    // COUNT
    const totalQuery = `
        SELECT COUNT(*)
        FROM subjects sub
        ${whereClause}
    `;

    const totalResult = await db.query(
        totalQuery,
        values.slice(0, values.length - 2)
    );

    const filteredRecords =
        parseInt(totalResult.rows[0].count);

    const globalCountResult = await db.query(`
        SELECT COUNT(*)
        FROM subjects
        WHERE deleted_at IS NULL
    `);

    const totalRecords =
        parseInt(globalCountResult.rows[0].count);

    const hasFilters = Boolean(
        queryOptions.search ||
        queryOptions.code
    );

    return {
        data: result.rows,

        message: hasFilters
            ? `Showing ${filteredRecords} matching subjects (${totalRecords} total)`
            : `Showing all ${totalRecords} subjects`,

        meta: {
            totalRecords,
            filteredRecords,
            hasFilters
        },

        pagination: buildPaginationMeta(
            filteredRecords,
            page,
            limit
        )
    };
};
const updateSubject = async (id, data) => {
    const query = `UPDATE subjects SET name= $1, code= $2, updated_at = NOW()
     WHERE id = $3 AND deleted_at IS NULL RETURNING *`;
    const values = [data.name, data.code, id];
    const result = await db.query(query, values);
    return result.rows[0];
};
const deleteSubject = async (id) => {
    const query = `UPDATE subjects SET deleted_at = NOW() WHERE id = $1 RETURNING *`;
    const values = [id];
    const result = await db.query(query, values);
    return result.rows[0];
};

module.exports = {
    createSubject,
    getAllSubjects,
    updateSubject,
    deleteSubject
};