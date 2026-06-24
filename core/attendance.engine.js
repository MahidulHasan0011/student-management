import { query } from '../config/db.js';

// ── Core business logic — attendance শতকরা হিসাব ──
export const attendanceEngine = {
  // student_attendance থেকে একটা ছাত্রের মাসিক উপস্থিতির হার বের করে
  async calculateStudentMonthlyAttendance(studentId, year, month) {
    const { rows } = await query(
      `SELECT
         status,
         COUNT(*) AS count
       FROM student_attendance
       WHERE student_id = $1
         AND EXTRACT(YEAR FROM attendance_date) = $2
         AND EXTRACT(MONTH FROM attendance_date) = $3
         AND deleted_at IS NULL
       GROUP BY status`,
      [studentId, year, month],
    );

    const summary = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    let total = 0;

    for (const row of rows) {
      summary[row.status] = parseInt(row.count);
      total += parseInt(row.count);
    }
    const presentCount = summary.PRESENT + summary.LATE; // LATE-কেও উপস্থিত ধরা হয়
    const attendancePercentage = total > 0 ? Math.round((presentCount / total) * 10000) / 100 : 0;

    return { ...summary, total_days: total, attendance_percentage: attendancePercentage };
  },
  // staff (attendance_logs) এর মাসিক কাজের সময় হিসাব
  async calculateStaffMonthlyWorkHours(userId, year, month) {
    const { rows } = await query(
      `SELECT
         COUNT(*) AS days_present,
         COALESCE(SUM(total_work_minutes), 0) AS total_minutes
       FROM attendance_logs
       WHERE user_id = $1
         AND EXTRACT(YEAR FROM attendance_date) = $2
         AND EXTRACT(MONTH FROM attendance_date) = $3
         AND deleted_at IS NULL
         AND status != 'ABSENT'`,
      [userId, year, month],
    );

    const row = rows[0];
    return {
      days_present: parseInt(row.days_present),
      total_work_minutes: parseInt(row.total_minutes),
      total_work_hours: Math.round((parseInt(row.total_minutes) / 60) * 100) / 100,
    };
  },

  // একটা class/section-এর একটা নির্দিষ্ট দিনের attendance summary — দ্রুত overview-র জন্য
  async calculateDailyClassSummary(classId, sectionId, date) {
    const { rows } = await query(
      `SELECT status, COUNT(*) AS count
       FROM student_attendance
       WHERE class_id = $1 AND section_id = $2 AND attendance_date = $3 AND deleted_at IS NULL
       GROUP BY status`,
      [classId, sectionId, date],
    );

    const summary = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    for (const row of rows) summary[row.status] = parseInt(row.count);
    return summary;
  },
};
