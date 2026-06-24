import { academicSessionRepository } from '../academic-sessions/academic-session.repository.js';
import { classRepository } from '../classes/class.repository.js';
import { examRepository } from '../exams/exam.repository.js';
import { rankingLockRepository } from '../ranking-locks/ranking-lock.repository.js';
import { AppError } from '../../utils/AppError.js';
import { enqueueRankingJob } from '../../queues/ranking.queue.js';

export const rankingService = {
  // admin "Generate Roll" বাটনে ক্লিক করলে এটা কল হয় — queue-তে job পাঠিয়ে সাথে সাথে রেসপন্স দেয়,
  // আসল ভারী calculation ব্যাকগ্রাউন্ডে worker (jobs/ranking.job.js) করে।
  //
  // triggeredBy: logged-in user-এর id — audit trail-এর জন্য, ranking_locks.locked_by-তে যাবে
  async triggerRankingAndRoll({ classId, academicSessionId, sectionId, triggeredBy }) {
    if (!classId || !academicSessionId) {
      throw new AppError("classId and academicSessionId are required", 400);
    }

    const cls = await classRepository.findById(classId);
    if (!cls) throw new AppError("Class not found", 404);

    const session = await academicSessionRepository.findById(academicSessionId);
    if (!session) throw new AppError("Academic session not found", 404);

    // ── ranking_locked চেক — আগে থেকে rank generate হয়ে থাকলে normal trigger আটকে যাবে ──
    // (RECALCULATE_RANKING আলাদা endpoint, যেটা প্রথমে explicit unlock করে — ধাপ ৬)
    const locked = await rankingLockRepository.isLocked(classId, academicSessionId);
    if (locked) {
      throw new AppError(
        "Ranking is already locked for this class & session. Use the recalculate endpoint to regenerate.",
        409
      );
    }

    // FINAL exam খুঁজে PUBLISHED কিনা যাচাই করো — Scenario 1 ও 2 দুটোতেই FINAL লাগবে
    const finalExam = await examRepository.findByClassSessionAndType(classId, academicSessionId, "FINAL");
    if (!finalExam) {
      throw new AppError("No FINAL exam found for this class and session", 404);
    }
    if (finalExam.status !== "PUBLISHED") {
      throw new AppError("FINAL exam results must be published before generating ranking", 400);
    }

    // Scenario 2 (admission_test_enabled = true) হলে ADMISSION exam-ও PUBLISHED হতে হবে
    if (session.admission_test_enabled) {
      const admissionExam = await examRepository.findByClassSessionAndType(classId, academicSessionId, "ADMISSION");
      if (!admissionExam) {
        throw new AppError("Admission test is enabled but no ADMISSION exam found for this class", 404);
      }
      if (admissionExam.status !== "PUBLISHED") {
        throw new AppError("ADMISSION exam results must be published before generating ranking", 400);
      }
    }

    const job = await enqueueRankingJob({
      classId,
      academicSessionId,
      sectionId: sectionId || null,
      admissionTestEnabled: session.admission_test_enabled,
      triggeredBy: triggeredBy || null,
    });

    return { jobId: job.id, status: "queued" };
  },
};