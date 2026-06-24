import { query, withTransaction } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

// ── Core business logic — কোনো HTTP/queue/job জানে না, শুধু calculation ──
// এই ফাইলটা ranking.job.js কল করবে, কিন্তু controller থেকেও সরাসরি কল করা যায় (sync ছোট কাজে)
export const rankingEngine = {
  // exam_id-এর জন্য merit list বের করে আনে — student_merit_list view ব্যবহার করে
  // (database/views/student_merit_list.sql এ আগেই বানানো হয়েছে)
  async calculateMeritList(examId) {
    const { rows } = await query(
      `SELECT * FROM student_merit_list WHERE exam_id = $1 ORDER BY rank_position ASC`,
      [examId],
    );

    if (!rows.length) {
      throw new AppError('No exam results found for this exam — cannot calculate ranking', 404);
    }

    return rows;
  },

  // class + session-এর সব ছাত্রের admission test বন্ধ থাকলে যারা admission দেয়নি
  // তাদের ক্রমিক ভর্তির তারিখ অনুযায়ী FIFO rank দেয় (rank শুরু হয় merit list-এর পর থেকে)
  async calculateFifoRanking(classId, academicSessionId, startRank) {
    const { rows } = await query(
      `SELECT
         se.student_id,
         se.id AS enrollment_id,
         se.created_at
       FROM student_enrollments se
       WHERE se.class_id = $1
         AND se.academic_session_id = $2
         AND se.roll_number IS NULL
         AND se.deleted_at IS NULL
       ORDER BY se.created_at ASC`,
      [classId, academicSessionId],
    );

    return rows.map((row, index) => ({
      ...row,
      rank_position: startRank + index,
    }));
  },

  // merit list rank + FIFO rank — দুটো মিলিয়ে roll.engine.js-কে দেওয়ার জন্য
  // admission_test_enabled অনুযায়ী কোন rank ব্যবহার হবে তা ঠিক করে
  async buildCombinedRanking({ examId, classId, academicSessionId, admissionTestEnabled }) {
    if (admissionTestEnabled) {
      // admission test চালু থাকলে সবাই (নতুন+পুরাতন) একসাথে merit list-এ rank পায়
      return this.calculateMeritList(examId);
    }

    // admission test বন্ধ — পুরাতনরা merit list থেকে rank পায়, নতুনরা FIFO
    const meritList = await this.calculateMeritList(examId).catch(() => []);
    const nextRank = meritList.length + 1;
    const fifoList = await this.calculateFifoRanking(classId, academicSessionId, nextRank);

    return [...meritList, ...fifoList];
  },
};
