import { query } from '../config/db.js';
import { AppError } from '../utils/appError.js';
import { rankingLockRepository } from '../modules/ranking-locks/ranking-lock.repository.js';
// ── Core business logic — কোনো HTTP/queue/job জানে না, শুধু calculation ──
// এই ফাইলটা ranking.job.js কল করবে।
//
// Scenario 1 (admission_test_enabled = false):
//   OLD student: QUIZ+MID+FINAL merit list rank (student_merit_list view থেকে)
//   NEW student: admission_date/created_at অনুযায়ী FIFO rank, merit list-এর পরে শুরু
//
// Scenario 2 (admission_test_enabled = true):
//   OLD ও NEW — দুই দলকেই একসাথে merge করে single merit list, score অনুযায়ী rank
//   (OLD-এর score = QUIZ+MID+FINAL, NEW-এর score = ADMISSION)
export const rankingEngine = {
  // class+session-এর OLD student-দের merit list — student_merit_list view থেকে
  // (database/views/student_merit_list.sql — QUIZ+MID+FINAL যোগ করে, tie-break সহ rank দেয়)
  async calculateOldStudentMeritList(classId, academicSessionId) {
    const { rows } = await query(
      `SELECT * FROM student_merit_list
       WHERE class_id = $1 AND academic_session_id = $2
       ORDER BY rank_position ASC`,
      [classId, academicSessionId]
    );
    return rows;
  },

  // NEW student-দের ADMISSION exam score — Scenario 2-এ merit list-এ merge করার জন্য
  async calculateNewStudentAdmissionScores(classId, academicSessionId) {
    const { rows } = await query(
      `SELECT
         er.student_id,
         s.student_code,
         u.full_name AS student_name,
         se.admission_date,
         se.created_at AS enrollment_created_at,
         SUM(er.marks) AS total_score,
         0 AS final_score,
         0 AS mid_score
       FROM exam_results er
       JOIN exams e ON e.id = er.exam_id
       JOIN students s ON s.id = er.student_id
       JOIN users u ON u.id = s.user_id
       JOIN student_enrollments se
         ON se.student_id = er.student_id
         AND se.academic_session_id = e.academic_session_id
         AND se.deleted_at IS NULL
       WHERE e.class_id = $1
         AND e.academic_session_id = $2
         AND e.exam_type = 'ADMISSION'
         AND e.status = 'PUBLISHED'
         AND er.deleted_at IS NULL
         AND e.deleted_at IS NULL
         AND s.deleted_at IS NULL
       GROUP BY er.student_id, s.student_code, u.full_name, se.admission_date, se.created_at`,
      [classId, academicSessionId]
    );
    return rows;
  },

  // ── deterministic sort — document-এর ৫ ধাপের tie-breaking rule এখানে আবার apply করা হয়
  // (Scenario 2-এ OLD+NEW merge করার পর নতুন করে rank বসাতে হয়, তাই sort logic এখানে লাগবে) ──
  _sortAndRank(students) {
    // Postgres numeric/SUM string হিসেবে আসে — তুলনার আগে Number()-এ আনা জরুরি,
    // আর merit-view "midterm_score" দেয় কিন্তু admission rows "mid_score" — দুটোই handle
    const num = (v) => Number(v) || 0;
    const finalOf = (r) => num(r.final_score);
    const midOf = (r) => num(r.mid_score ?? r.midterm_score);

    const sorted = [...students].sort((a, b) => {
      if (num(b.total_score) !== num(a.total_score)) return num(b.total_score) - num(a.total_score);
      if (finalOf(b) !== finalOf(a)) return finalOf(b) - finalOf(a);
      if (midOf(b) !== midOf(a)) return midOf(b) - midOf(a);

      const aAdm = a.admission_date ? new Date(a.admission_date).getTime() : Infinity;
      const bAdm = b.admission_date ? new Date(b.admission_date).getTime() : Infinity;
      if (aAdm !== bAdm) return aAdm - bAdm;

      const aCreated = new Date(a.enrollment_created_at).getTime();
      const bCreated = new Date(b.enrollment_created_at).getTime();
      if (aCreated !== bCreated) return aCreated - bCreated;

      return a.student_id < b.student_id ? -1 : a.student_id > b.student_id ? 1 : 0;
    });

    return sorted.map((row, index) => ({ ...row, rank_position: index + 1 }));
  },

  // class + session-এর NEW student-দের (যাদের কোনো admission result নেই, roll_number এখনো null)
  // admission_date/created_at অনুযায়ী FIFO rank — rank শুরু হয় merit list-এর পরের নম্বর থেকে
  async calculateFifoRanking(classId, academicSessionId, startRank) {
    const { rows } = await query(
      `SELECT
         se.student_id,
         se.id AS enrollment_id,
         se.admission_date,
         se.created_at
       FROM student_enrollments se
       WHERE se.class_id = $1
         AND se.academic_session_id = $2
         AND se.roll_number IS NULL
         AND se.deleted_at IS NULL
       ORDER BY se.admission_date ASC, se.created_at ASC`,
      [classId, academicSessionId]
    );

    // FIFO student-দের কোনো exam score নেই → total_score = 0 (history snapshot-এ লাগবে)
    return rows.map((row, index) => ({
      ...row,
      total_score: 0,
      rank_position: startRank + index,
    }));
  },

  // ── মূল entry point — Scenario 1/2 অনুযায়ী সঠিক ranking তৈরি করে roll.engine.js-কে পাঠায় ──
  // গুরুত্বপূর্ণ rule: ranking/roll শুধুমাত্র FINAL exam publish হলেই চলবে (caller আগেই চেক করে আসে)
  //
  // allowWhenLocked = true হলে lock check skip হয় — এটা শুধু RECALCULATE_RANKING manual
  // flow ব্যবহার করবে (ধাপ ৬), যেখানে admin আগেই explicit unlock করে এই flow চালু করেছেন।
  // স্বাভাবিক auto-trigger এই flag কখনো true পাঠাবে না।
  async buildCombinedRanking({ classId, academicSessionId, admissionTestEnabled, allowWhenLocked = false }) {
    if (!allowWhenLocked) {
      const locked = await rankingLockRepository.isLocked(classId, academicSessionId);
      if (locked) {
        throw new AppError(
          "Ranking is locked for this class & session. An administrator must unlock it before recalculating.",
          409
        );
      }
    }

    const oldMeritList = await this.calculateOldStudentMeritList(classId, academicSessionId);

    if (!admissionTestEnabled) {
      // ── Scenario 1 ── OLD ranked, NEW FIFO পরে
      if (!oldMeritList.length) {
        throw new AppError("No published FINAL results found for this class — cannot calculate ranking", 404);
      }
      const nextRank = oldMeritList.length + 1;
      const fifoList = await this.calculateFifoRanking(classId, academicSessionId, nextRank);
      return [...oldMeritList, ...fifoList];
    }

    // ── Scenario 2 ── OLD + NEW merge করে single merit list, score দিয়ে rank
    const newAdmissionScores = await this.calculateNewStudentAdmissionScores(classId, academicSessionId);

    const combined = [...oldMeritList, ...newAdmissionScores];
    if (!combined.length) {
      throw new AppError("No published results found (FINAL or ADMISSION) — cannot calculate ranking", 404);
    }

    return this._sortAndRank(combined);
  },
};