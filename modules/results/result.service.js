const db = require("../../config/db");

const addResult = async (data) => {
  const result = await db.query(
    `
    INSERT INTO exam_results
    (
      exam_id,
      student_id,
      subject_id,
      marks,
      grade
    )
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *
    `,
    [
      data.exam_id,
      data.student_id,
      data.subject_id,
      data.marks,
      data.grade,
    ]
  );

  return result.rows[0];
};

const getResults = async () => {
  const result = await db.query(`
    SELECT *
    FROM exam_results
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `);

  return result.rows;
};
const updateResult = async (id, data) => {
    const result = await db.query(
        `
    UPDATE exam_results
    SET
      exam_id = $1,
      student_id = $2,
      subject_id = $3,
      marks = $4,
      grade = $5,
      updated_at = NOW()
    WHERE id = $6 AND deleted_at IS NULL
    RETURNING *
    `,
        [
            id,
            data.exam_id,
            data.student_id,
            data.subject_id,
            data.marks,
            data.grade
        ]);

    return result.rows[0];
}
const deleteResult = async (id) => {
    const result = await db.query(
        `
    UPDATE exam_results
    SET deleted_at = NOW()
    WHERE id = $1 
    RETURNING *
    `,
        [id]
    );

    return result.rows[0];
};


module.exports = {
  addResult,
  getResults,
  updateResult,
  deleteResult
};