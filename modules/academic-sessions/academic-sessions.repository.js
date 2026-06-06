const db = require("../../config/db");

// CREATE
const createSession = async (data) => {
    const result = await db.query(
        `INSERT INTO academic_sessions (name, start_date, end_date, is_active)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [data.name, data.start_date, data.end_date, data.is_active]
    );
    return result.rows[0];
};

// GET ALL — query বানানো repository-র কাজ
const getAllSessions = async ({ whereClause, sortBy, sortOrder, values, limit, offset, countRef }) => {
    const mainQuery = `
        SELECT * FROM academic_sessions
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT  $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    const countQuery = `
        SELECT COUNT(*) FROM academic_sessions
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
        SELECT COUNT(*) FROM academic_sessions
        WHERE deleted_at IS NULL
    `);
    return parseInt(result.rows[0].count);
};

// UPDATE
const updateSession = async (id, data) => {
    const result = await db.query(
        `UPDATE academic_sessions
         SET name = $1, start_date = $2, end_date = $3, is_active = $4, updated_at = NOW()
         WHERE id = $5 AND deleted_at IS NULL
         RETURNING *`,
        [data.name, data.start_date, data.end_date, data.is_active, id]
    );
    return result.rows[0];
};

// DELETE (soft)
const deleteSession = async (id) => {
    const result = await db.query(
        `UPDATE academic_sessions SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

module.exports = { 
    createSession, 
    getAllSessions, 
    globalCount, 
    updateSession, 
    deleteSession
 };