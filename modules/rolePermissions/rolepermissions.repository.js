const db = require("../../config/db");

// CREATE
const assignRolePermission = async (data) => {
    const result = await db.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         VALUES ($1, $2)
         RETURNING *`,
        [data.role_id, data.permission_id]
    );
    return result.rows[0];
};

// GET ALL
const getRolePermissions = async ({ whereClause, sortBy, sortOrder, values, limit, offset, countRef }) => {
    const baseJoins = `
        FROM role_permissions rp
        LEFT JOIN roles r       ON rp.role_id = r.id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        ${whereClause}
    `;

    const mainQuery = `
        SELECT
            rp.*,
            r.name AS role_name,
            p.name AS permission_name
        ${baseJoins}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT  $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    const countQuery = `
        SELECT COUNT(DISTINCT rp.id)
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
        SELECT COUNT(*) FROM role_permissions
        WHERE deleted_at IS NULL
    `);
    return parseInt(result.rows[0].count);
};

// UPDATE
const updateRolePermission = async (id, data) => {
    const result = await db.query(
        `UPDATE role_permissions
         SET
             role_id       = $1,
             permission_id = $2,
             updated_at    = NOW()
         WHERE id = $3 AND deleted_at IS NULL
         RETURNING *`,
        [data.role_id, data.permission_id, id]
    );
    return result.rows[0];
};

// DELETE (soft)
const deleteRolePermission = async (id) => {
    const result = await db.query(
        `UPDATE role_permissions SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

module.exports = { assignRolePermission, getRolePermissions, globalCount, updateRolePermission, deleteRolePermission };