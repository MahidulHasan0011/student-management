import { query, withTransaction } from '../../config/db.js';
import { buildWhereClause } from '../../utils/queryBuilder.js';
import { buildOrder } from '../../utils/order.js';

// ── DB write/read layer — attendance.engine only computes (read-only),
//    the actual mark/check-in/check-out happens here ──

const SA_SORTABLE = {
  attendance_date: 'sa.attendance_date',
  created_at: 'sa.created_at',
};

const SA_FILTER = {
  searchableColumns: [],
  filterableColumns: [
    { param: 'student_id', column: 'sa.student_id' },
    { param: 'class_id', column: 'sa.class_id' },
    { param: 'section_id', column: 'sa.section_id' },
    { param: 'attendance_date', column: 'sa.attendance_date' },
    { param: 'status', column: 'sa.status' },
  ],
};

export const attendanceRepository = {
  // ── Student attendance ──

  // whether a record already exists for a student on a given date — to prevent duplicates
  async findStudentRecord(client, studentId, attendanceDate) {
    const exec = client ? client.query.bind(client) : query;
    const { rows } = await exec(
      `SELECT * FROM student_attendance
       WHERE student_id = $1 AND attendance_date = $2 AND deleted_at IS NULL
       LIMIT 1`,
      [studentId, attendanceDate],
    );
    return rows[0] || null;
  },

  // mark a class/section's single-day attendance in one go — upsert (update if exists, otherwise insert)
  // the whole thing runs in a single transaction → a partial failure rolls everything back (data consistency)
  async bulkMarkStudents({ classId, sectionId, attendanceDate, records }) {
    return withTransaction(async (client) => {
      const results = [];
      for (const { student_id, status } of records) {
        const existing = await this.findStudentRecord(client, student_id, attendanceDate);

        if (existing) {
          const { rows } = await client.query(
            `UPDATE student_attendance
             SET status = $1, class_id = $2, section_id = $3, updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [status, classId, sectionId, existing.id],
          );
          results.push(rows[0]);
        } else {
          const { rows } = await client.query(
            `INSERT INTO student_attendance (student_id, class_id, section_id, attendance_date, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [student_id, classId, sectionId, attendanceDate, status],
          );
          results.push(rows[0]);
        }
      }
      return results;
    });
  },

  async listStudentAttendance(queryOptions, { limit, offset }) {
    const values = [];
    const countRef = { value: 1 };
    const where = buildWhereClause(queryOptions, values, SA_FILTER, countRef, 'sa');
    const { sortBy, sortOrder } = buildOrder(queryOptions, SA_SORTABLE, 'attendance_date');

    values.push(limit, offset);
    const limitIdx = countRef.value;
    const offsetIdx = countRef.value + 1;

    const { rows } = await query(
      `SELECT sa.*, u.full_name AS student_name, s.student_code
       FROM student_attendance sa
       JOIN students s ON s.id = sa.student_id
       JOIN users u ON u.id = s.user_id
       ${where}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      values,
    );
    return rows;
  },

  async countStudentAttendance(queryOptions) {
    const values = [];
    const countRef = { value: 1 };
    const where = buildWhereClause(queryOptions, values, SA_FILTER, countRef, 'sa');
    const { rows } = await query(`SELECT COUNT(*) FROM student_attendance sa ${where}`, values);
    return parseInt(rows[0].count);
  },

  // ── Staff attendance (attendance_logs) ──

  // today's (or a specific date's) log — used for check-in/out
  async findStaffLog(userId, attendanceDate) {
    const { rows } = await query(
      `SELECT * FROM attendance_logs
       WHERE user_id = $1 AND attendance_date = $2 AND deleted_at IS NULL
       LIMIT 1`,
      [userId, attendanceDate],
    );
    return rows[0] || null;
  },

  async createCheckIn({ userId, attendanceDate, ipAddress, latitude, longitude }) {
    const { rows } = await query(
      `INSERT INTO attendance_logs
         (user_id, attendance_date, check_in, status, ip_address, check_in_latitude, check_in_longitude)
       VALUES ($1, $2, NOW(), 'PRESENT', $3, $4, $5)
       RETURNING *`,
      [userId, attendanceDate, ipAddress ?? null, latitude ?? null, longitude ?? null],
    );
    return rows[0];
  },

  // check-out — computes and stores the elapsed time in minutes from check_in until now
  async setCheckOut({ logId, latitude, longitude }) {
    const { rows } = await query(
      `UPDATE attendance_logs
       SET check_out = NOW(),
           total_work_minutes = GREATEST(0, ROUND(EXTRACT(EPOCH FROM (NOW() - check_in)) / 60)),
           check_out_latitude = COALESCE($2, check_out_latitude),
           check_out_longitude = COALESCE($3, check_out_longitude),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [logId, latitude ?? null, longitude ?? null],
    );
    return rows[0];
  },
};
