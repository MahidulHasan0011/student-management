const db = require("../../config/db");

// CREATE
const addResult = async (data) => {
    const result = await db.query(
        `INSERT INTO exam_results
         (exam_id, student_id, subject_id, marks, grade)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
            data.exam_id,
            data.student_id,
            data.subject_id,
            data.marks,
            data.grade
        ]
    );
    return result.rows[0];
};

// GET ALL
const getResults = async ({ whereClause, sortBy, sortOrder, values, limit, offset, countRef }) => {
    const baseJoins = `
        FROM exam_results er
        LEFT JOIN exams e       ON er.exam_id = e.id
        LEFT JOIN students st   ON er.student_id = st.id
        LEFT JOIN subjects sub  ON er.subject_id = sub.id
        ${whereClause}
    `;

    const mainQuery = `
        SELECT
            er.*,
            e.name          AS exam_name,
            st.full_name    AS student_name,
            sub.name        AS subject_name
        ${baseJoins}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT  $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    const countQuery = `
        SELECT COUNT(DISTINCT er.id)
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
        SELECT COUNT(*) FROM exam_results
        WHERE deleted_at IS NULL
    `);
    return parseInt(result.rows[0].count);
};

// UPDATE
const updateResult = async (id, data) => {
    const result = await db.query(
        `UPDATE exam_results
         SET
             exam_id    = $1,
             student_id = $2,
             subject_id = $3,
             marks      = $4,
             grade      = $5,
             updated_at = NOW()
         WHERE id = $6 AND deleted_at IS NULL
         RETURNING *`,
        [
            data.exam_id,
            data.student_id,
            data.subject_id,
            data.marks,
            data.grade,
            id
        ]
    );
    return result.rows[0];
};

// DELETE (soft)
const deleteResult = async (id) => {
    const result = await db.query(
        `UPDATE exam_results SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

module.exports = { addResult, getResults, globalCount, updateResult, deleteResult };