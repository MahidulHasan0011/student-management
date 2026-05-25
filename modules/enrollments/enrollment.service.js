const db = require("../../config/db");

const enrollStudent = async (data) => {
  const result = await db.query(
    `
    INSERT INTO student_enrollments
    (
      student_id,
      class_id,
      section_id,
      academic_session_id,
      roll_number
    )
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *
    `,
    [
      data.student_id,
      data.class_id,
      data.section_id,
      data.academic_session_id,
      data.roll_number,
    ]
  );

  return result.rows[0];
};

const getEnrollments = async () => {
  const result = await db.query(`
    SELECT *
    FROM student_enrollments
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `);

  return result.rows;
};
const updateEnrollment = async (id, data) => {
  const result = await db.query(
    `
    UPDATE student_enrollments
    SET
      student_id = $1,
      class_id = $2,
      section_id = $3,
      academic_session_id = $4,
      roll_number = $5,
      updated_at = NOW()
    WHERE id = $6 AND deleted_at IS NULL
    RETURNING *
    `,
    [
      id,
      data.student_id,
      data.class_id,
      data.section_id,
      data.academic_session_id,
      data.roll_number
    ]
  );

  return result.rows[0];
};
const deleteEnrollment = async (id) => {
  const result = await db.query(
    `
    UPDATE student_enrollments
    SET deleted_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );
  return result.rows[0];
};

module.exports = {
  enrollStudent,
  getEnrollments,
  updateEnrollment,
  deleteEnrollment
};