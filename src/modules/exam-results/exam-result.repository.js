import { query } from '../../config/db.js';
import { buildWhereClause } from '../../utils/queryBuilder.js';
import { buildOrder } from '../../utils/order.js';

const SORTABLE_FIELDS = {
  marks: 'er.marks',
  created_at: 'er.created_at',
};

const FILTER_CONFIG = {
  searchableColumns: [],
  filterableColumns: [
    { param: 'exam_id', column: 'er.exam_id' },
    { param: 'student_id', column: 'er.student_id' },
    { param: 'subject_id', column: 'er.subject_id' },
  ],
};

export const examResultRepository = {
  async create({ exam_id, student_id, subject_id, marks, grade }) {
    const { rows } = await query(
      `INSERT INTO exam_results (exam_id, student_id, subject_id, marks, grade)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [exam_id, student_id, subject_id, marks, grade],
    );
    return rows[0];
  },

  async findAll(queryOptions, { limit, offset }) {
    const values = [];
    const countRef = { value: 1 };

    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef, 'er');
    const { sortBy, sortOrder } = buildOrder(queryOptions, SORTABLE_FIELDS, 'created_at');

    values.push(limit, offset);
    const limitIdx = countRef.value;
    const offsetIdx = countRef.value + 1;

    const { rows } = await query(
      `SELECT
         er.*,
         e.name AS exam_name, e.exam_type, e.status AS exam_status,
         u.full_name AS student_name, s.student_code,
         sub.name AS subject_name, sub.code AS subject_code
       FROM exam_results er
       JOIN exams e ON e.id = er.exam_id
       JOIN students s ON s.id = er.student_id
       JOIN users u ON u.id = s.user_id
       JOIN subjects sub ON sub.id = er.subject_id
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
    const where = buildWhereClause(queryOptions, values, FILTER_CONFIG, countRef, 'er');
    const { rows } = await query(`SELECT COUNT(*) FROM exam_results er ${where}`, values);
    return parseInt(rows[0].count);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT
         er.*,
         e.name AS exam_name, e.exam_type, e.status AS exam_status,
         u.full_name AS student_name, s.student_code,
         sub.name AS subject_name, sub.code AS subject_code
       FROM exam_results er
       JOIN exams e ON e.id = er.exam_id
       JOIN students s ON s.id = er.student_id
       JOIN users u ON u.id = s.user_id
       JOIN subjects sub ON sub.id = er.subject_id
       WHERE er.id = $1 AND er.deleted_at IS NULL`,
      [id],
    );
    return rows[0] || null;
  },

  // Whether an entry already exists per the (exam_id, student_id, subject_id) unique constraint
  async findByExamStudentSubject(exam_id, student_id, subject_id) {
    const { rows } = await query(
      `SELECT * FROM exam_results
       WHERE exam_id = $1 AND student_id = $2 AND subject_id = $3 AND deleted_at IS NULL`,
      [exam_id, student_id, subject_id],
    );
    return rows[0] || null;
  },

  // All subject-wise results for an exam (to build a marksheet — the caller does the student-wise grouping)
  async findByExamId(examId) {
    const { rows } = await query(
      `SELECT
         er.*,
         u.full_name AS student_name, s.student_code,
         sub.name AS subject_name, sub.code AS subject_code
       FROM exam_results er
       JOIN students s ON s.id = er.student_id
       JOIN users u ON u.id = s.user_id
       JOIN subjects sub ON sub.id = er.subject_id
       WHERE er.exam_id = $1 AND er.deleted_at IS NULL
       ORDER BY u.full_name, sub.name`,
      [examId],
    );
    return rows;
  },

  // All subject results of a single exam for a single student — for a marksheet/report card
  async findByExamAndStudent(examId, studentId) {
    const { rows } = await query(
      `SELECT er.*, sub.name AS subject_name, sub.code AS subject_code
       FROM exam_results er
       JOIN subjects sub ON sub.id = er.subject_id
       WHERE er.exam_id = $1 AND er.student_id = $2 AND er.deleted_at IS NULL
       ORDER BY sub.name`,
      [examId, studentId],
    );
    return rows;
  },

  async update(id, { marks, grade }) {
    const setClauses = [];
    const params = [];

    if (marks !== undefined) {
      params.push(marks);
      setClauses.push(`marks = $${params.length}`);
    }
    if (grade !== undefined) {
      params.push(grade);
      setClauses.push(`grade = $${params.length}`);
    }
    if (!setClauses.length) return null;

    params.push(id);
    const { rows } = await query(
      `UPDATE exam_results SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} AND deleted_at IS NULL
       RETURNING *`,
      params,
    );
    return rows[0] || null;
  },

  async softDelete(id) {
    const { rows } = await query(
      `UPDATE exam_results SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id],
    );
    return rows[0] || null;
  },

  // bulk entry — set marks for many students/subjects at once for a single exam (when a teacher enters them together)
  // instead of a single insert, loop with a transaction client — individual errors can be caught on duplicates
  async bulkCreate(client, entries) {
    const results = [];
    for (const entry of entries) {
      const { rows } = await client.query(
        `INSERT INTO exam_results (exam_id, student_id, subject_id, marks, grade)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (exam_id, student_id, subject_id)
         DO UPDATE SET marks = EXCLUDED.marks, grade = EXCLUDED.grade, updated_at = NOW(),
                        deleted_at = NULL
         RETURNING *`,
        [entry.exam_id, entry.student_id, entry.subject_id, entry.marks, entry.grade],
      );
      results.push(rows[0]);
    }
    return results;
  },
};
