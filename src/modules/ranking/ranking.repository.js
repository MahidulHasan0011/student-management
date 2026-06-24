import { query } from '../../config/db.js';

export const rankingRepository = {
  // class+session-এর জন্য PUBLISHED FINAL exam খুঁজে দেয় — manual trigger validation-এর জন্য
  async findPublishedFinalExam({ classId, academicSessionId }) {
    const { rows } = await query(
      `SELECT id, name, exam_type, status, class_id, academic_session_id
       FROM exams
       WHERE class_id = $1
         AND academic_session_id = $2
         AND exam_type = 'FINAL'
         AND status = 'PUBLISHED'
         AND deleted_at IS NULL
       ORDER BY exam_date DESC NULLS LAST
       LIMIT 1`,
      [classId, academicSessionId],
    );
    return rows[0] || null;
  },

  // class+session-এর জন্য PUBLISHED ADMISSION exam — Scenario 2 dual-publish চেক-এর জন্য
  async findPublishedAdmissionExam({ classId, academicSessionId }) {
    const { rows } = await query(
      `SELECT id, name, exam_type, status
       FROM exams
       WHERE class_id = $1
         AND academic_session_id = $2
         AND exam_type = 'ADMISSION'
         AND status = 'PUBLISHED'
         AND deleted_at IS NULL
       LIMIT 1`,
      [classId, academicSessionId],
    );
    return rows[0] || null;
  },

  // class+session-এর ranking_locks row — না থাকলে null
  async getLock({ classId, academicSessionId }) {
    const { rows } = await query(
      `SELECT id, is_locked, locked_at, locked_by
       FROM ranking_locks
       WHERE class_id = $1 AND academic_session_id = $2`,
      [classId, academicSessionId],
    );
    return rows[0] || null;
  },
};
