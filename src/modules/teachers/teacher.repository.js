import { query, withTransaction } from '../../config/db.js';
import { buildWhereClause } from '../../utils/queryBuilder.js';
import { buildOrder } from '../../utils/order.js';

const SAFE_COLUMNS = `
  t.id, t.user_id, t.phone, t.designation, t.qualification, t.joining_date,
  t.created_at, t.updated_at,
  u.full_name, u.email, u.gender, u.is_active
`;

const SORTABLE_FIELDS = {
  full_name: 'u.full_name',
  joining_date: 't.joining_date',
  created_at: 't.created_at',
};

const FILTER_CONFIG = {
  searchableColumns: ['u.full_name', 'u.email', 't.phone'],
  filterableColumns: [],
};

export const teacherRepository = {
  // Create user + teacher together — the caller handles the transaction (service layer)
  async createUser(client, { full_name, email, password, role_id, gender }) {
    const { rows } = await client.query(
      `INSERT INTO users (full_name, email, password, role_id, gender)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [full_name, email, password, role_id, gender || 'MALE'],
    );
    return rows[0];
  },

  async createTeacherProfile(client, { user_id, phone, designation, qualification, joining_date }) {
    const { rows } = await client.query(
      `INSERT INTO teachers (user_id, phone, designation, qualification, joining_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, phone || null, designation || null, qualification || null, joining_date || null],
    );
    return rows[0];
  },

  async findAll(queryOptions, { limit, offset }) {
    const values = [];
    const countRef = { value: 1 };

    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef, 't');
    const { sortBy, sortOrder } = buildOrder(queryOptions, SORTABLE_FIELDS, 'created_at');

    values.push(limit, offset);
    const limitIdx = countRef.value;
    const offsetIdx = countRef.value + 1;

    const { rows } = await query(
      `SELECT ${SAFE_COLUMNS}
       FROM teachers t
       JOIN users u ON u.id = t.user_id
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
    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef, 't');
    const { rows } = await query(
      `SELECT COUNT(*) FROM teachers t JOIN users u ON u.id = t.user_id ${where}`,
      values,
    );
    return parseInt(rows[0].count);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT ${SAFE_COLUMNS}
       FROM teachers t
       JOIN users u ON u.id = t.user_id
       WHERE t.id = $1 AND t.deleted_at IS NULL`,
      [id],
    );
    return rows[0] || null;
  },

  async findByUserId(user_id) {
    const { rows } = await query(
      `SELECT * FROM teachers WHERE user_id = $1 AND deleted_at IS NULL`,
      [user_id],
    );
    return rows[0] || null;
  },

  // All of the teacher's subject assignments (for the active session) — to show with the profile
  async findAssignments(teacherId) {
    const { rows } = await query(
      `SELECT
         sa.id, sa.class_id, c.name AS class_name,
         sa.section_id, sec.name AS section_name,
         sa.subject_id, sub.name AS subject_name,
         sa.academic_session_id, asess.name AS session_name
       FROM subject_assignments sa
       JOIN classes c ON c.id = sa.class_id
       LEFT JOIN sections sec ON sec.id = sa.section_id
       JOIN subjects sub ON sub.id = sa.subject_id
       JOIN academic_sessions asess ON asess.id = sa.academic_session_id
       WHERE sa.teacher_id = $1 AND sa.deleted_at IS NULL
       ORDER BY c.name, sec.name`,
      [teacherId],
    );
    return rows;
  },

  async update(id, { phone, designation, qualification, joining_date }) {
    const setClauses = [];
    const params = [];
    const fields = { phone, designation, qualification, joining_date };

    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) {
        params.push(val);
        setClauses.push(`${key} = $${params.length}`);
      }
    }
    if (!setClauses.length) return null;

    params.push(id);
    const { rows } = await query(
      `UPDATE teachers SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} AND deleted_at IS NULL
       RETURNING *`,
      params,
    );
    return rows[0] || null;
  },

  async softDelete(id) {
    const { rows } = await query(
      `UPDATE teachers SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id, user_id`,
      [id],
    );
    return rows[0] || null;
  },

  async hasActiveAssignments(teacherId) {
    const { rows } = await query(
      `SELECT id FROM subject_assignments WHERE teacher_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [teacherId],
    );
    return rows.length > 0;
  },
};
