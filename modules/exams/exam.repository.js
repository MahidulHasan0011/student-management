import { query } from '../../config/db.js';
import { buildWhereClause } from '../../utils/queryBuilder.js';
import { buildOrder } from '../../utils/order.js';

const SORTABLE_FIELDS = {
  name: 'e.name',
  exam_date: 'e.exam_date',
  created_at: 'e.created_at',
};

const FILTER_CONFIG = {
  searchableColumns: ['e.name'],
  filterableColumns: [
    { param: 'class_id', column: 'e.class_id' },
    { param: 'academic_session_id', column: 'e.academic_session_id' },
    { param: 'exam_type', column: 'e.exam_type' },
  ],
};

export const examRepository = {
  async create({ name, class_id, academic_session_id, exam_date, exam_type }) {
    const { rows } = await query(
      `INSERT INTO exams (name, class_id, academic_session_id, exam_date, exam_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        name,
        class_id || null,
        academic_session_id || null,
        exam_date || null,
        exam_type || 'ADMISSION',
      ],
    );
    return rows[0];
  },

  async findAll(queryOptions, { limit, offset }) {
    const values = [];
    const countRef = { value: 1 };

    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef, 'e');
    const { sortBy, sortOrder } = buildOrder(queryOptions, SORTABLE_FIELDS, 'exam_date');

    values.push(limit, offset);
    const limitIdx = countRef.value;
    const offsetIdx = countRef.value + 1;

    const { rows } = await query(
      `SELECT e.*, c.name AS class_name, asess.name AS session_name
       FROM exams e
       LEFT JOIN classes c ON c.id = e.class_id
       LEFT JOIN academic_sessions asess ON asess.id = e.academic_session_id
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
    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef, 'e');
    const { rows } = await query(`SELECT COUNT(*) FROM exams e ${where}`, values);
    return parseInt(rows[0].count);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT e.*, c.name AS class_name, asess.name AS session_name
       FROM exams e
       LEFT JOIN classes c ON c.id = e.class_id
       LEFT JOIN academic_sessions asess ON asess.id = e.academic_session_id
       WHERE e.id = $1 AND e.deleted_at IS NULL`,
      [id],
    );
    return rows[0] || null;
  },

  async update(id, fields) {
    const allowed = ['name', 'class_id', 'academic_session_id', 'exam_date', 'exam_type'];
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
      `UPDATE exams SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} AND deleted_at IS NULL
       RETURNING *`,
      params,
    );
    return rows[0] || null;
  },

  // exam status DRAFT ↔ PUBLISHED টগল করার জন্য — update() থেকে আলাদা রাখা হয়েছে
  // কারণ publish করার সময় বিশেষ business rule (ranking_locked চেক) আছে, সেটা service-এ হবে
  async setStatus(id, status) {
    const { rows } = await query(
      `UPDATE exams SET status = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [status, id],
    );
    return rows[0] || null;
  },

  async softDelete(id) {
    const { rows } = await query(
      `UPDATE exams SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id],
    );
    return rows[0] || null;
  },

  // class+session-এর নির্দিষ্ট exam_type-এর exam খুঁজে আনে — status সহ (PUBLISHED কিনা চেক করতে)
  // একই class+session-এ একই exam_type একবারই থাকবে এই ধরে নেওয়া হচ্ছে
  async findByClassSessionAndType(classId, academicSessionId, examType) {
    const { rows } = await query(
      `SELECT * FROM exams
       WHERE class_id = $1 AND academic_session_id = $2 AND exam_type = $3
         AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [classId, academicSessionId, examType],
    );
    return rows[0] || null;
  },

  async hasResults(id) {
    const { rows } = await query(
      `SELECT id FROM exam_results WHERE exam_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id],
    );
    return rows.length > 0;
  },

  // এই exam-এর class-এ মোট কতজন ছাত্র enrolled আছে — auto-trigger-এর জন্য লাগবে
  // ("সবার result entry হয়ে গেছে কিনা" বোঝার জন্য এই সংখ্যা দরকার)
  async countEnrolledStudents(classId, academicSessionId) {
    const { rows } = await query(
      `SELECT COUNT(*) FROM student_enrollments
       WHERE class_id = $1 AND academic_session_id = $2 AND deleted_at IS NULL`,
      [classId, academicSessionId],
    );
    return parseInt(rows[0].count);
  },

  // এই exam-এ কতজন distinct ছাত্রের result entry হয়েছে
  async countStudentsWithResults(examId) {
    const { rows } = await query(
      `SELECT COUNT(DISTINCT student_id) FROM exam_results
       WHERE exam_id = $1 AND deleted_at IS NULL`,
      [examId],
    );
    return parseInt(rows[0].count);
  },
};
