require("dotenv").config();
const { Client } = require("pg");
const config = require("../config/env");

const main = async () => {
  const client = new Client({ connectionString: config.DATABASE_URL });

  try {
    await client.connect();
    console.log("Connected\n");

    await client.query(`
      TRUNCATE TABLE
        public.leaves,
        public.attendance_logs,
        public.student_attendance,
        public.fee_structures,
        public.exam_results,
        public.exams,
        public.student_enrollments,
        public.subject_assignments,
        public.subjects,
        public.academic_sessions,
        public.sections,
        public.classes,
        public.students,
        public.teachers,
        public.role_permissions,
        public.permissions,
        public.users,
        public.roles
      CASCADE
    `);

    console.log("All tables truncated!");
  } catch (err) {
    console.error("Failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
};

main();