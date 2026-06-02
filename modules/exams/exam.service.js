const db = require("../../config/db");

const createExam = async (data) => {
    const result = await db.query(
        `
    INSERT INTO exams
    (name, class_id, academic_session_id, exam_date)
    VALUES ($1,$2,$3,$4)
    RETURNING *
    `,
        [
            data.name,
            data.class_id,
            data.academic_session_id,
            data.exam_date,
        ]
    );

    return result.rows[0];
};

const getExams = async (queryOptions) => {
     //pagination
    const { page, limit, offset } = buildPagination(queryOptions);

    const result = await db.query(`
    SELECT *
    FROM exams
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `);

    return result.rows;
};
const updateExam = async (id, data) => {
    const result = await db.query(
        `
    UPDATE exams
    SET
      name = $1,
      class_id = $2,
      academic_session_id = $3,
      exam_date = $4,
      updated_at = NOW()
    WHERE id = $5 AND deleted_at IS NULL
    RETURNING *
    `,
        [
            id,
            data.name,
            data.class_id,
            data.academic_session_id,
            data.exam_date
        ]);

    return result.rows[0];
}
const deleteExam = async (id) => {
    const result = await db.query(
        `
    UPDATE exams
    SET deleted_at = NOW()
    WHERE id = $1 
    RETURNING *
    `,
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