const db = require("../../config/db");

// CREATE
const createSubject = async (data) => {
    const result = await db.query(
        `INSERT INTO subjects (name, code) VALUES ($1, $2) RETURNING *`,
        [data.name, data.code]
    );
    return result.rows[0];
};

// GET ALL
const getAllSubjects = async ({ whereClause, sortBy, sortOrder, values, limit, offset, countRef }) => {
    const mainQuery = `
        SELECT * FROM subjects sub
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT  $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    const countQuery = `
        SELECT COUNT(*) FROM subjects sub
        ${whereClause}
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
        SELECT COUNT(*) FROM subjects
        WHERE deleted_at IS NULL
    `);
    return parseInt(result.rows[0].count);
};

// UPDATE
const updateSubject = async (id, data) => {
    const result = await db.query(
        `UPDATE subjects
         SET name = $1, code = $2, updated_at = NOW()
         WHERE id = $3 AND deleted_at IS NULL
         RETURNING *`,
        [data.name, data.code, id]
    );
    return result.rows[0];
};

// DELETE (soft)
const deleteSubject = async (id) => {
    const result = await db.query(
        `UPDATE subjects SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

module.exports = { createSubject, getAllSubjects, globalCount, updateSubject, deleteSubject };