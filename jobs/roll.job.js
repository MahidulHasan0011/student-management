const { Worker } = require("bullmq");
const db = require("../config/db");

new Worker("roll-queue", async job => {
  const { class_id, exam_id, academic_session_id } = job.data;

  const result = await db.query(`
    SELECT student_id,
           SUM(marks) as total_marks
    FROM exam_results
    WHERE class_id = $1
      AND academic_session_id = $2
    GROUP BY student_id
    ORDER BY total_marks DESC
  `, [class_id, academic_session_id]);

  for (let i = 0; i < result.rows.length; i++) {
    await db.query(`
      UPDATE student_enrollments
      SET roll_number = $1
      WHERE student_id = $2
    `, [i + 1, result.rows[i].student_id]);
  }
});