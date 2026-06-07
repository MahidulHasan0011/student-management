const db = require("../../config/db");

// CREATE
const createTeacher = async (data) => {
    const result = await db.query(
        `INSERT INTO teachers (user_id, phone, designation, qualification)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [data.user_id, data.phone, data.designation, data.qualification]
    );
    return result.rows[0];
};

// GET ALL
const getAllTeachers = async ({ whereClause, sortBy, sortOrder, values, limit, offset, countRef }) => {
    const baseJoins = `
        FROM teachers t
        LEFT JOIN users u ON t.user_id = u.id
        ${whereClause}
    `;

    const mainQuery = `
        SELECT
            t.*,
            u.full_name,
            u.email,
            u.is_active
        ${baseJoins}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT  $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    const countQuery = `
        SELECT COUNT(DISTINCT t.id)
        ${baseJoins}
    `;

    const filterValues = [...values];
    const mainValues   = [...values, limit, offset];

    const [dataResult, countResult] = await Promise.all([
        db.query(mainQuery, mainValues),
        db.query(countQuery, filterValues)
    ]);

    return {
        rows:          dataResult.rows,
        filteredCount: parseInt(countResult.rows[0].count)
    };
};

// GLOBAL COUNT
const globalCount = async () => {
    const result = await db.query(`
        SELECT COUNT(*) FROM teachers
        WHERE deleted_at IS NULL
    `);
    return parseInt(result.rows[0].count);
};

// UPDATE
const updateTeacher = async (id, data) => {
    const result = await db.query(
        `UPDATE teachers
         SET
             user_id       = $1,
             phone         = $2,
             designation   = $3,
             qualification = $4,
             updated_at    = NOW()
         WHERE id = $5 AND deleted_at IS NULL
         RETURNING *`,
        [data.user_id, data.phone, data.designation, data.qualification, id]
    );
    return result.rows[0];
};

// DELETE (soft)
const deleteTeacher = async (id) => {
    const result = await db.query(
        `UPDATE teachers SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

module.exports = { createTeacher, getAllTeachers, globalCount, updateTeacher, deleteTeacher };