const db = require("../../config/db");

// CREATE
const createSection = async (data) => {
    const result = await db.query(
        `INSERT INTO sections (class_id, name) VALUES ($1, $2) RETURNING *`,
        [data.class_id, data.name]
    );
    return result.rows[0];
};

// GET ALL
const getSections = async ({ whereClause, sortBy, sortOrder, values, limit, offset, countRef }) => {
    const baseJoins = `
        FROM sections s
        LEFT JOIN classes c ON s.class_id = c.id
        ${whereClause}
    `;

    const mainQuery = `
        SELECT
            s.*,
            c.name AS class_name
        ${baseJoins}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT  $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    const countQuery = `
        SELECT COUNT(DISTINCT s.id)
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
        SELECT COUNT(*) FROM sections
        WHERE deleted_at IS NULL
    `);
    return parseInt(result.rows[0].count);
};

// UPDATE
const updateSection = async (id, data) => {
    const result = await db.query(
        `UPDATE sections
         SET
             class_id   = $1,
             name       = $2,
             updated_at = NOW()
         WHERE id = $3 AND deleted_at IS NULL
         RETURNING *`,
        [data.class_id, data.name, id]
    );
    return result.rows[0];
};

// DELETE (soft)
const deleteSection = async (id) => {
    const result = await db.query(
        `UPDATE sections SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

module.exports = { createSection, getSections, globalCount, updateSection, deleteSection };