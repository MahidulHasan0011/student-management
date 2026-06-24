import { query } from '../../config/db.js';
import { buildWhereClause } from '../../utils/queryBuilder.js';
import { buildOrder } from '../../utils/order.js';

const SAFE_COLUMNS = `
  s.id, s.student_code, s.date_of_birth, s.guardian_name, s.guardian_phone,
  s.address, s.user_id, s.created_at, s.updated_at,
  u.full_name, u.email, u.gender, u.is_active
`;

const SORTABLE_FIELDS = {
  full_name: 'u.full_name',
  student_code: 's.student_code',
  created_at: 's.created_at',
};

const FILTER_CONFIG = {
  searchableColumns: ['u.full_name', 'u.email', 's.student_code', 's.guardian_name'],
  filterableColumns: [],
};

export const studentRepository = {
  // user + student profile একসাথে — caller (service) transaction-এ চালাবে
  async createUser(client, { full_name, email, password, role_id, gender }) {
    const { rows } = await client.query(
      `INSERT INTO users (full_name, email, password, role_id, gender)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [full_name, email, password, role_id, gender || 'MALE'],
    );
    return rows[0];
  },

  async createStudentProfile(
    client,
    { user_id, student_code, date_of_birth, guardian_name, guardian_phone, address },
  ) {
    const { rows } = await client.query(
      `INSERT INTO students (user_id, student_code, date_of_birth, guardian_name, guardian_phone, address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        user_id,
        student_code,
        date_of_birth || null,
        guardian_name || null,
        guardian_phone || null,
        address || null,
      ],
    );
    return rows[0];
  },

  async findAll(queryOptions, { limit, offset }) {
    const values = [];
    const countRef = { value: 1 };

    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef, 's');
    const { sortBy, sortOrder } = buildOrder(queryOptions, SORTABLE_FIELDS, 'created_at');

    values.push(limit, offset);
    const limitIdx = countRef.value;
    const offsetIdx = countRef.value + 1;

    const { rows } = await query(
      `SELECT ${SAFE_COLUMNS}
       FROM students s
       JOIN users u ON u.id = s.user_id
       ${where}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      values,
    );
    return rows;
  },

  async countAll(queryOptions) {
    const values = [];
    const countRef = { value: 1 };
    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef, 's');
    const { rows } = await query(
      `SELECT COUNT(*) FROM students s JOIN users u ON u.id = s.user_id ${where}`,
      values,
    );
    return parseInt(rows[0].count);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT ${SAFE_COLUMNS}
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1 AND s.deleted_at IS NULL`,
      [id],
    );
    return rows[0] || null;
  },

  async findByStudentCode(student_code) {
    const { rows } = await query(
      `SELECT * FROM students WHERE student_code = $1 AND deleted_at IS NULL`,
      [student_code],
    );
    return rows[0] || null;
  },

  async findByUserId(user_id) {
    const { rows } = await query(
      `SELECT * FROM students WHERE user_id = $1 AND deleted_at IS NULL`,
      [user_id],
    );
    return rows[0] || null;
  },

  // student-এর current enrollment (active session-এর) — class/section/roll জানার জন্য
  async findCurrentEnrollment(studentId) {
    const { rows } = await query(
      `SELECT
         se.id AS enrollment_id, se.roll_number,
         se.class_id, c.name AS class_name,
         se.section_id, sec.name AS section_name,
         se.academic_session_id, asess.name AS session_name
       FROM student_enrollments se
       JOIN academic_sessions asess ON asess.id = se.academic_session_id
       JOIN classes c ON c.id = se.class_id
       LEFT JOIN sections sec ON sec.id = se.section_id
       WHERE se.student_id = $1 AND asess.is_active = true AND se.deleted_at IS NULL
       LIMIT 1`,
      [studentId],
    );
    return rows[0] || null;
  },

  async update(id, fields) {
    const allowed = ['date_of_birth', 'guardian_name', 'guardian_phone', 'address'];
    const setClauses = [];
    const params = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        params.push(fields[key]);
        setClauses.push(`${key} = $${params.length}`);
      }
    }
    if (!setClauses.length) return null;

    params.push(id);
    const { rows } = await query(
      `UPDATE students SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} AND deleted_at IS NULL
       RETURNING *`,
      params,
    );
    return rows[0] || null;
  },

  async softDelete(id) {
    const { rows } = await query(
      `UPDATE students SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id, user_id`,
      [id],
    );
    return rows[0] || null;
  },

  async hasEnrollments(studentId) {
    const { rows } = await query(
      `SELECT id FROM student_enrollments WHERE student_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [studentId],
    );
    return rows.length > 0;
  },
};
