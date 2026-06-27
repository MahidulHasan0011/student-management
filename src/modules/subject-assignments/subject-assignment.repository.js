import { query } from '../../config/db.js';
import { buildWhereClause } from '../../utils/queryBuilder.js';
import { buildOrder } from '../../utils/order.js';

const SORTABLE_FIELDS = {
  created_at: 'sa.created_at',
};

const FILTER_CONFIG = {
  searchableColumns: [],
  filterableColumns: [
    { param: 'teacher_id', column: 'sa.teacher_id' },
    { param: 'class_id', column: 'sa.class_id' },
    { param: 'section_id', column: 'sa.section_id' },
    { param: 'subject_id', column: 'sa.subject_id' },
    { param: 'academic_session_id', column: 'sa.academic_session_id' },
  ],
};

export const subjectAssignmentRepository = {
  async create({ teacher_id, class_id, section_id, subject_id, academic_session_id, assigned_by }) {
    const { rows } = await query(
      `INSERT INTO subject_assignments
         (teacher_id, class_id, section_id, subject_id, academic_session_id, assigned_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        teacher_id,
        class_id,
        section_id || null,
        subject_id,
        academic_session_id,
        assigned_by || null,
      ],
    );
    return rows[0];
  },

  async findAll(queryOptions, { limit, offset }) {
    const values = [];
    const countRef = { value: 1 };

    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef, 'sa');
    const { sortBy, sortOrder } = buildOrder(queryOptions, SORTABLE_FIELDS, 'created_at');

    values.push(limit, offset);
    const limitIdx = countRef.value;
    const offsetIdx = countRef.value + 1;

    const { rows } = await query(
      `SELECT
         sa.*,
         u.full_name AS teacher_name,
         c.name AS class_name,
         sec.name AS section_name,
         sub.name AS subject_name, sub.code AS subject_code,
         asess.name AS session_name
       FROM subject_assignments sa
       JOIN teachers t ON t.id = sa.teacher_id
       JOIN users u ON u.id = t.user_id
       JOIN classes c ON c.id = sa.class_id
       LEFT JOIN sections sec ON sec.id = sa.section_id
       JOIN subjects sub ON sub.id = sa.subject_id
       JOIN academic_sessions asess ON asess.id = sa.academic_session_id
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
    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef, 'sa');
    const { rows } = await query(`SELECT COUNT(*) FROM subject_assignments sa ${where}`, values);
    return parseInt(rows[0].count);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT
         sa.*,
         u.full_name AS teacher_name,
         c.name AS class_name,
         sec.name AS section_name,
         sub.name AS subject_name, sub.code AS subject_code,
         asess.name AS session_name
       FROM subject_assignments sa
       JOIN teachers t ON t.id = sa.teacher_id
       JOIN users u ON u.id = t.user_id
       JOIN classes c ON c.id = sa.class_id
       LEFT JOIN sections sec ON sec.id = sa.section_id
       JOIN subjects sub ON sub.id = sa.subject_id
       JOIN academic_sessions asess ON asess.id = sa.academic_session_id
       WHERE sa.id = $1 AND sa.deleted_at IS NULL`,
      [id],
    );
    return rows[0] || null;
  },

  // ৫টা field মিলিয়ে duplicate চেক — DB unique constraint-এর সাথেই মেলে
  // (subject_assignments_teacher_id_class_id_section_id_subject__key)
  async findExact({ teacher_id, class_id, section_id, subject_id, academic_session_id }) {
    const { rows } = await query(
      `SELECT * FROM subject_assignments
       WHERE teacher_id = $1 AND class_id = $2
         AND section_id IS NOT DISTINCT FROM $3
         AND subject_id = $4 AND academic_session_id = $5
         AND deleted_at IS NULL`,
      [teacher_id, class_id, section_id || null, subject_id, academic_session_id],
    );
    return rows[0] || null;
  },

  // একই class+section+subject+session-এ অন্য কোনো teacher আগে থেকেই assigned আছে কিনা —
  // (একই বিষয় একই সেকশনে দুইজন শিক্ষক একসাথে পড়াবে কিনা সেটা business rule-এর প্রশ্ন,
  // এই method শুধু তথ্য দেয়, block করার সিদ্ধান্ত service-এ)
  async findOtherTeacherForSlot(
    { class_id, section_id, subject_id, academic_session_id },
    excludeTeacherId = null,
  ) {
    const params = [class_id, section_id || null, subject_id, academic_session_id];
    let extra = '';
    if (excludeTeacherId) {
      params.push(excludeTeacherId);
      extra = `AND teacher_id != $${params.length}`;
    }

    const { rows } = await query(
      `SELECT * FROM subject_assignments
       WHERE class_id = $1
         AND section_id IS NOT DISTINCT FROM $2
         AND subject_id = $3 AND academic_session_id = $4
         AND deleted_at IS NULL
         ${extra}`,
      params,
    );
    return rows;
  },

  async update(id, { teacher_id, class_id, section_id, subject_id, academic_session_id }) {
    const setClauses = [];
    const params = [];
    const fields = { teacher_id, class_id, section_id, subject_id, academic_session_id };

    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) {
        params.push(val);
        setClauses.push(`${key} = $${params.length}`);
      }
    }
    if (!setClauses.length) return null;

    params.push(id);
    const { rows } = await query(
      `UPDATE subject_assignments SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} AND deleted_at IS NULL
       RETURNING *`,
      params,
    );
    return rows[0] || null;
  },

  async softDelete(id) {
    const { rows } = await query(
      `UPDATE subject_assignments SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id],
    );
    return rows[0] || null;
  },

  // teacher-এর সব assignment (active session-এর) — teacher.controller.js-এর getWithAssignments-এও
  // আগে এই ধরনের query ব্যবহার হয়েছিল, এখানে module-নিজস্ব ভার্সন
  async findByTeacherId(teacherId) {
    const { rows } = await query(
      `SELECT
         sa.*,
         c.name AS class_name, sec.name AS section_name,
         sub.name AS subject_name, asess.name AS session_name
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
};
