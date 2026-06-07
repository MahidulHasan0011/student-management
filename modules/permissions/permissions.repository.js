const db = require("../../config/db");

// CREATE
const createPermission = async (data) => {
    const result = await db.query(
        `INSERT INTO permissions (name) VALUES ($1) RETURNING *`,
        [data.name]
    );
    return result.rows[0];
};

// GET ALL
const getPermissions = async ({ whereClause, sortBy, sortOrder, values, limit, offset, countRef }) => {
    const mainQuery = `
        SELECT * FROM permissions
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT  $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    const countQuery = `
        SELECT COUNT(*) FROM permissions
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
        SELECT COUNT(*) FROM permissions
        WHERE deleted_at IS NULL
    `);
    return parseInt(result.rows[0].count);
};

// UPDATE
const updatePermission = async (id, data) => {
    const result = await db.query(
        `UPDATE permissions
         SET name = $1, updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [data.name, id]
    );
    return result.rows[0];
};

// DELETE (soft)
const deletePermission = async (id) => {
    const result = await db.query(
        `UPDATE permissions SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

module.exports = { createPermission, getPermissions, globalCount, updatePermission, deletePermission };