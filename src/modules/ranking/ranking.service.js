import { rankingRepository } from './ranking.repository.js';
import { classRepository } from '../classes/class.repository.js';
import { academicSessionRepository } from '../academic-sessions/academic-session.repository.js';
import { AppError } from '../../utils/appError.js';
import { enqueueRankingJob } from '../../queues/ranking.queue.js';

export const rankingService = {
  // Manual trigger — admin POST /ranking/trigger { class_id, academic_session_id, section_id? }
  // Validation chain (requirements §5.6 + §5.7):
  //   1. class + session exist
  //   2. একটা FINAL exam class+session-এর জন্য PUBLISHED হতে হবে
  //   3. session-এর admission_test_enabled = true হলে ADMISSION exam-ও PUBLISHED হতে হবে (Scenario 2)
  //   4. ranking_locks.is_locked = true থাকলে block (manual recalculate এর জন্য আলাদা endpoint লাগবে — §7.4)
  async trigger({ class_id, academic_session_id, section_id }) {
    if (!class_id || !academic_session_id) {
      throw new AppError('class_id and academic_session_id are required', 400);
    }

    const cls = await classRepository.findById(class_id);
    if (!cls) throw new AppError('Class not found', 404);

    const session = await academicSessionRepository.findById(academic_session_id);
    if (!session) throw new AppError('Academic session not found', 404);

    const finalExam = await rankingRepository.findPublishedFinalExam({
      classId: class_id,
      academicSessionId: academic_session_id,
    });
    if (!finalExam) {
      throw new AppError('No PUBLISHED FINAL exam found for this class + academic session', 409);
    }

    if (session.admission_test_enabled) {
      const admissionExam = await rankingRepository.findPublishedAdmissionExam({
        classId: class_id,
        academicSessionId: academic_session_id,
      });
      if (!admissionExam) {
        throw new AppError(
          'admission_test_enabled is true but no PUBLISHED ADMISSION exam exists for this class + session',
          409,
        );
      }
    }

    const lock = await rankingRepository.getLock({
      classId: class_id,
      academicSessionId: academic_session_id,
    });
    if (lock?.is_locked) {
      throw new AppError(
        'Ranking is locked for this class + session. Use the recalculate flow to override.',
        409,
      );
    }

    const job = await enqueueRankingJob({
      examId: finalExam.id,
      classId: class_id,
      academicSessionId: academic_session_id,
      admissionTestEnabled: !!session.admission_test_enabled,
      sectionId: section_id || null,
    });

    return {
      job_id: job.id,
      exam_id: finalExam.id,
      class_id,
      academic_session_id,
      admission_test_enabled: !!session.admission_test_enabled,
    };
  },
};
