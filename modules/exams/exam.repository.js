const db = require("../../config/db");

const createExam = async (data) => {
    const result = await db.query(
        `INSERT INTO exams
         (name, class_id, academic_session_id, exam_date, exam_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
             data.name,
            data.class_id,
            data.academic_session_id,
            data.exam_date,
            data.exam_type
        ]
    );
    return result.rows[0];
};


const getExams = async ({ whereClause, sortBy, sortOrder, values, limit, offset, countRef }) => {
    const baseJoins = `
        FROM exams e
        LEFT JOIN classes c         ON e.class_id = c.id
        LEFT JOIN academic_sessions ac ON e.academic_session_id = ac.id
        ${whereClause}
    `;

    const mainQuery = `
        SELECT
            e.*,
            c.name          AS class_name,
            ac.name         AS session_name
        ${baseJoins}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT  $${countRef.value}
        OFFSET $${countRef.value + 1}
    `;

    const countQuery = `
        SELECT COUNT(DISTINCT e.id)
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

const globalCount = async () => {
    const result = await db.query(`
        SELECT COUNT(*) FROM exams
        WHERE deleted_at IS NULL
    `);
    return parseInt(result.rows[0].count);
};


const updateExam = async (id, data) => {
    const result = await db.query(
        `UPDATE exams
         SET
             name                = $1,
             class_id            = $2,
             academic_session_id = $3,
             exam_date           = $4,
             exam_type           = $5,
             updated_at          = NOW()
         WHERE id = $6 AND deleted_at IS NULL
         RETURNING *`,
        [
            data.name,
            data.class_id,
            data.academic_session_id,
            data.exam_date,
            data.exam_type,
            id
        ]
    );
    return result.rows[0];
};

// DELETE (soft)
const deleteExam = async (id) => {
    const result = await db.query(
        `UPDATE exams SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

        

module.exports = {
    createExam,
    getExams,
    updateExam,
    deleteExam
};