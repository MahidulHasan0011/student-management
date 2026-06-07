const db = require("../../config/db");

const createClass = async (data) => {
    const result = await db.query(
        `INSERT INTO classes (name) VALUES ($1) RETURNING *`,
        [data.name]
    );
    return result.rows[0];
};

const getAllClasses = async ({ whereClause, sortBy, sortOrder, values, limit, offset, countRef }) => {
    const mainQuery = `
        SELECT * FROM classes
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT  $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    const countQuery = `
        SELECT COUNT(*) FROM classes
        ${whereClause}
    `;

    const filterValues = [...values];
    const mainValues   = [...values, limit, offset];

    const [dataResult, countResult] = await Promise.all([
        db.query(mainQuery, mainValues),
        db.query(countQuery, filterValues)
    ]);

    return {
        rows: dataResult.rows,
        filteredCount: parseInt(countResult.rows[0].count)
    };
};


const globalCount = async () => {
    const result = await db.query(`
        SELECT COUNT(*) FROM classes
        WHERE deleted_at IS NULL
    `);
    return parseInt(result.rows[0].count);
};


const updateClass = async (id, data) => {
    const result = await db.query(
        `UPDATE classes
         SET name = $1, updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [data.name, id]
    );
    return result.rows[0];
};


const deleteClass = async (id) => {
    const result = await db.query(
        `UPDATE classes SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

module.exports = { createClass, getAllClasses, globalCount, updateClass, deleteClass };