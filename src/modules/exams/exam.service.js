import { examRepository } from './exam.repository.js';
import { classRepository } from '../classes/class.repository.js';
import { academicSessionRepository } from '../academic-sessions/academic-session.repository.js';
import { AppError } from '../../utils/appError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { rankingService } from '../ranking/ranking.service.js';
import {
  assertString,
  assertUuid,
  assertDate,
  assertEnum,
  EXAM_TYPES,
} from '../../utils/validators.js';

export const examService = {
  async create({ name, class_id, academic_session_id, exam_date, exam_type }) {
    name = assertString(name, 'name', { max: 100 });
    class_id = assertUuid(class_id, 'class_id', { required: false });
    academic_session_id = assertUuid(academic_session_id, 'academic_session_id', {
      required: false,
    });
    exam_date = assertDate(exam_date, 'exam_date', { required: false });
    exam_type = assertEnum(exam_type, 'exam_type', EXAM_TYPES, { required: false });

    if (class_id) {
      const cls = await classRepository.findById(class_id);
      if (!cls) throw new AppError('Class not found', 404);
    }

    if (academic_session_id) {
      const session = await academicSessionRepository.findById(academic_session_id);
      if (!session) throw new AppError('Academic session not found', 404);
    }

    return examRepository.create({
      name,
      class_id,
      academic_session_id,
      exam_date,
      exam_type,
    });
  },

  async getAll(queryOptions) {
    const { page, limit, offset } = getPagination(queryOptions);
    const [data, total] = await Promise.all([
      examRepository.findAll(queryOptions, { limit, offset }),
      examRepository.countAll(queryOptions),
    ]);
    return { data, meta: buildMeta({ total, page, limit }) };
  },

  async getById(id) {
    const exam = await examRepository.findById(id);
    if (!exam) throw new AppError('Exam not found', 404);
    return exam;
  },

  async update(id, fields) {
    await this.getById(id);

    if (fields.name !== undefined) {
      fields.name = assertString(fields.name, 'name', { max: 100 });
    }
    if (fields.class_id !== undefined) {
      fields.class_id = assertUuid(fields.class_id, 'class_id', { required: false });
    }
    if (fields.academic_session_id !== undefined) {
      fields.academic_session_id = assertUuid(fields.academic_session_id, 'academic_session_id', {
        required: false,
      });
    }
    if (fields.exam_date !== undefined) {
      fields.exam_date = assertDate(fields.exam_date, 'exam_date', { required: false });
    }
    if (fields.exam_type !== undefined) {
      fields.exam_type = assertEnum(fields.exam_type, 'exam_type', EXAM_TYPES, { required: false });
    }

    const updated = await examRepository.update(id, fields);
    if (!updated) throw new AppError('Exam not found', 404);
    return updated;
  },

  async delete(id) {
    await this.getById(id);

    const hasResults = await examRepository.hasResults(id);
    if (hasResults) {
      throw new AppError('Cannot delete exam — results already exist. Delete results first.', 400);
    }

    const deleted = await examRepository.softDelete(id);
    if (!deleted) throw new AppError('Exam not found', 404);
    return deleted;
  },

  // exam-এর class-এ enrolled সব ছাত্রের result entry সম্পূর্ণ হয়েছে কিনা — auto-trigger-এর জন্য মূল check
  // শুধুমাত্র FINAL exam-এই ranking/roll trigger হবে — UNIT_TEST/MIDTERM/ADMISSION-এ না
  async isResultEntryComplete(examId) {
    const exam = await this.getById(examId);

    if (exam.exam_type !== 'FINAL') return false; // FINAL ছাড়া কখনো ranking trigger হবে না
    if (!exam.class_id || !exam.academic_session_id) return false; // class/session না থাকলে চেক করা যায় না

    const [enrolledCount, resultCount] = await Promise.all([
      examRepository.countEnrolledStudents(exam.class_id, exam.academic_session_id),
      examRepository.countStudentsWithResults(examId),
    ]);

    return enrolledCount > 0 && resultCount >= enrolledCount;
  },

  // ── DRAFT → PUBLISHED ──
  // Publish করার পর exam_results আর সাধারণভাবে edit করা যাবে না (correction আলাদা flow-এ হবে, ধাপ পরে)
  async publish(id) {
    const exam = await this.getById(id);

    if (exam.status === 'PUBLISHED') {
      throw new AppError('Exam is already published', 400);
    }

    if (!exam.class_id || !exam.academic_session_id) {
      throw new AppError('Exam must have a class and academic session before publishing', 400);
    }

    const hasResults = await examRepository.hasResults(id);
    if (!hasResults) {
      throw new AppError('Cannot publish an exam with no results entered', 400);
    }

    const updated = await examRepository.setStatus(id, 'PUBLISHED');

    // ── Auto-trigger ──
    // FINAL বা ADMISSION publish হলে ranking চলার শর্ত পূরণ হয়েছে কিনা ranking module নিজে যাচাই করবে।
    // এটা কখনো throw করে না (publish সফল হয়েছে, ranking আলাদা concern) — শর্ত না মিললে চুপচাপ skip হয়।
    if (exam.exam_type === 'FINAL' || exam.exam_type === 'ADMISSION') {
      await rankingService.autoTriggerAfterPublish({
        classId: exam.class_id,
        academicSessionId: exam.academic_session_id,
        examType: exam.exam_type,
      });
    }

    return updated;
  },

  // ── PUBLISHED → DRAFT ──
  // Unpublish করলে result correction করা যায় (ধাপ পরে যুক্ত হবে), কিন্তু ranking_locked থাকলে আটকাতে হবে —
  // নাহলে already-locked roll/rank-এর ভিত্তি বদলে যাবে অথচ roll নম্বর পুরনোই থেকে যাবে
  async unpublish(id) {
    const exam = await this.getById(id);

    if (exam.status === 'DRAFT') {
      throw new AppError('Exam is already in draft status', 400);
    }

    return examRepository.setStatus(id, 'DRAFT');
  },
};
