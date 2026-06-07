const db = require("../../config/db");

// CREATE
const createUser = async (data) => {
    const result = await db.query(
        `INSERT INTO users (full_name, email, password, role_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [data.full_name, data.email, data.password, data.role_id]
    );
    return result.rows[0];
};

// GET ALL
const getUsers = async ({ whereClause, sortBy, sortOrder, values, limit, offset, countRef }) => {
    const baseJoins = `
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        ${whereClause}
    `;

    const mainQuery = `
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.is_active,
            u.created_at,
            r.name AS role_name
        ${baseJoins}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT  $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    const countQuery = `
        SELECT COUNT(DISTINCT u.id)
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
        SELECT COUNT(*) FROM users
        WHERE deleted_at IS NULL
    `);
    return parseInt(result.rows[0].count);
};

// UPDATE
const updateUser = async (id, data) => {
    const result = await db.query(
        `UPDATE users
         SET
             full_name  = $1,
             email      = $2,
             password   = $3,
             role_id    = $4,
             updated_at = NOW()
         WHERE id = $5 AND deleted_at IS NULL
         RETURNING *`,
        [data.full_name, data.email, data.password, data.role_id, id]
    );
    return result.rows[0];
};

// DELETE (soft)
const deleteUser = async (id) => {
    const result = await db.query(
        `UPDATE users SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

module.exports = { createUser, getUsers, globalCount, updateUser, deleteUser };