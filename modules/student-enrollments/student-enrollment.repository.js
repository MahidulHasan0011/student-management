import { query } from "../../config/db.js";
import { buildWhereClause } from "../../utils/queryBuilder.js";
import { buildOrder } from "../../utils/order.js";

const SORTABLE_FIELDS = {
  roll_number: "se.roll_number",
  created_at: "se.created_at",
};

const FILTER_CONFIG = {
  searchableColumns: [],
  filterableColumns: [
    { param: "class_id", column: "se.class_id" },
    { param: "section_id", column: "se.section_id" },
    { param: "academic_session_id", column: "se.academic_session_id" },
  ],
};

export const studentEnrollmentRepository = {
  async create({ student_id, class_id, section_id, academic_session_id }) {
    const { rows } = await query(
      `INSERT INTO student_enrollments (student_id, class_id, section_id, academic_session_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [student_id, class_id, section_id || null, academic_session_id]
    );
    return rows[0];
  },

  async findAll(queryOptions, { limit, offset }) {
    const values = [];
    const countRef = { value: 1 };

    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef, "se");
    const { sortBy, sortOrder } = buildOrder(queryOptions, SORTABLE_FIELDS, "created_at");

    values.push(limit, offset);
    const limitIdx = countRef.value;
    const offsetIdx = countRef.value + 1;

    const { rows } = await query(
      `SELECT
         se.*,
         u.full_name AS student_name, s.student_code,
         c.name AS class_name, sec.name AS section_name, asess.name AS session_name
       FROM student_enrollments se
       JOIN students s ON s.id = se.student_id
       JOIN users u ON u.id = s.user_id
       JOIN classes c ON c.id = se.class_id
       LEFT JOIN sections sec ON sec.id = se.section_id
       JOIN academic_sessions asess ON asess.id = se.academic_session_id
       ${where}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      values
    );
    return rows;
  },

  async countAll(queryOptions) {
    const values = [];
    const countRef = { value: 1 };
    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef, "se");
    const { rows } = await query(
      `SELECT COUNT(*) FROM student_enrollments se ${where}`,
      values
    );
    return parseInt(rows[0].count);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT
         se.*,
         u.full_name AS student_name, s.student_code,
         c.name AS class_name, sec.name AS section_name, asess.name AS session_name
       FROM student_enrollments se
       JOIN students s ON s.id = se.student_id
       JOIN users u ON u.id = s.user_id
       JOIN classes c ON c.id = se.class_id
       LEFT JOIN sections sec ON sec.id = se.section_id
       JOIN academic_sessions asess ON asess.id = se.academic_session_id
       WHERE se.id = $1 AND se.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  // একই student + session-এ আগে enroll করা আছে কিনা — unique constraint অনুযায়ী
  async findByStudentAndSession(studentId, academicSessionId) {
    const { rows } = await query(
      `SELECT * FROM student_enrollments
       WHERE student_id = $1 AND academic_session_id = $2 AND deleted_at IS NULL`,
      [studentId, academicSessionId]
    );
    return rows[0] || null;
  },

  async update(id, fields) {
    const allowed = ["class_id", "section_id", "roll_number"];
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
      `UPDATE student_enrollments SET ${setClauses.join(", ")}, updated_at = NOW()
       WHERE id = $${params.length} AND deleted_at IS NULL
       RETURNING *`,
      params
    );
    return rows[0] || null;
  },

  async softDelete(id) {
    const { rows } = await query(
      `UPDATE student_enrollments SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );
    return rows[0] || null;
  },
};