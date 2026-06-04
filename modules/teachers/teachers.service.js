const db = require("../../config/db");
const { buildWhereClause } = require("../../utils/queryBuilder");
const {buildPagination, buildPaginationMeta} = require("../../utils/pagination");
const { buildOrder } = require("../../utils/order");

const createTeacherst = async (data) => {
    const query = `INSERT INTO subjects (user_id, phone, designation, qualification) VALUES ($1, $2, $3, $4) RETURNING *`;
    const values = [data.user_id, data.phone, data.designation, data.qualification];
    const result = await db.query(query, values);
    return result.rows[0];
};
const getAllTeachers = async (queryOptions) => {

    // pagination
    const { page, limit, offset } =
        buildPagination(queryOptions);

    // sorting
    const { sortBy, sortOrder } =
        buildOrder(queryOptions, {
            created_at: "t.created_at",
            teacher_name: "u.full_name",
            email: "u.email",
            designation: "t.designation"
        });

    const values = [];
    const countRef = { value: 1 };

    const config = {
        searchableColumns: [
            "u.full_name",
            "u.email",
            "t.phone",
            "t.designation",
            "t.qualification"
        ],

        filterableColumns: [
            "t.designation"
        ]
    };

    const whereClause = buildWhereClause(
        queryOptions,
        values,
        config,
        countRef,
        "t"
    );

    // MAIN QUERY
    const query = `
        SELECT
            t.*,
            u.full_name,
            u.email,
            u.is_active

        FROM teachers t

        LEFT JOIN users u
            ON t.user_id = u.id

        ${whereClause}

        ORDER BY ${sortBy} ${sortOrder}

        LIMIT $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    values.push(limit, offset);

    const result = await db.query(query, values);

    // FILTERED COUNT
    const totalQuery = `
        SELECT COUNT(DISTINCT t.id)

        FROM teachers t

        LEFT JOIN users u
            ON t.user_id = u.id

        ${whereClause}
    `;

    const totalResult = await db.query(
        totalQuery,
        values.slice(0, values.length - 2)
    );

    const filteredRecords =
        parseInt(totalResult.rows[0].count);

    // GLOBAL COUNT
    const globalCountResult = await db.query(`
        SELECT COUNT(*)
        FROM teachers
        WHERE deleted_at IS NULL
    `);

    const totalRecords =
        parseInt(globalCountResult.rows[0].count);

    const hasFilters = Boolean(
        queryOptions.search ||
        queryOptions.designation
    );

    return {
        data: result.rows,

        message: hasFilters
            ? `Showing ${filteredRecords} matching teachers (${totalRecords} total)`
            : `Showing all ${totalRecords} teachers`,

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
const updateTeacherst = async (id, data) => {
    const query = `UPDATE teachers SET user_id= $1, phone= $2, designation= $3, qualification= $4, updated_at = NOW()
     WHERE id = $5 AND deleted_at IS NULL RETURNING *`;
    const values = [data.user_id, data.phone, data.designation, data.qualification, id];
    const result = await db.query(query, values);
    return result.rows[0];
};
const deleteTeacherst = async (id) => {
    const query = `UPDATE teachers SET deleted_at = NOW() WHERE id = $1 RETURNING *`;
    const values = [id];
    const result = await db.query(query, values);
    return result.rows[0];
};

module.exports = {
    createTeacherst,
    getAllTeachers,
    updateTeacherst,
    deleteTeacherst
};