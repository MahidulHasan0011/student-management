import { examResultRepository } from './exam-result.repository.js';
import { examRepository } from '../exams/exam.repository.js';
import { studentRepository } from '../students/student.repository.js';
import { subjectRepository } from '../subjects/subject.repository.js';
import { calculateGrade } from '../../utils/grade.js';
import { AppError } from '../../utils/AppError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { withTransaction } from '../../config/db.js';
import { assertUuid, assertNumber, assertArray } from '../../utils/validators.js';

export const examResultService = {
  async create({ exam_id, student_id, subject_id, marks }) {
    exam_id = assertUuid(exam_id, 'exam_id');
    student_id = assertUuid(student_id, 'student_id');
    subject_id = assertUuid(subject_id, 'subject_id');
    marks = assertNumber(marks, 'marks', { min: 0, max: 100 });

    const exam = await examRepository.findById(exam_id);
    if (!exam) throw new AppError('Exam not found', 404);

    // ── Once published, direct create/update is blocked — correction happens in a separate workflow (later) ──
    if (exam.status === 'PUBLISHED') {
      throw new AppError('This exam is published — unpublish it first to modify results', 400);
    }

    const student = await studentRepository.findById(student_id);
    if (!student) throw new AppError('Student not found', 404);

    const subject = await subjectRepository.findById(subject_id);
    if (!subject) throw new AppError('Subject not found', 404);

    const existing = await examResultRepository.findByExamStudentSubject(
      exam_id,
      student_id,
      subject_id,
    );
    if (existing) {
      throw new AppError(
        'Result already exists for this exam/student/subject — use update instead',
        409,
      );
    }

    const grade = calculateGrade(marks);
    return examResultRepository.create({ exam_id, student_id, subject_id, marks, grade });
  },

  // Enter marks for many students at once — teachers usually work this way (one exam, one subject, the whole class)
  // entries = [{ student_id, subject_id, marks }, ...]
  async bulkCreate(examId, entries) {
    examId = assertUuid(examId, 'examId');
    entries = assertArray(entries, 'entries');

    const exam = await examRepository.findById(examId);
    if (!exam) throw new AppError('Exam not found', 404);

    if (exam.status === 'PUBLISHED') {
      throw new AppError('This exam is published — unpublish it first to modify results', 400);
    }

    for (const entry of entries) {
      entry.student_id = assertUuid(entry.student_id, 'student_id');
      entry.subject_id = assertUuid(entry.subject_id, 'subject_id');
      entry.marks = assertNumber(entry.marks, 'marks', { min: 0, max: 100 });
    }

    const enrichedEntries = entries.map((e) => ({
      exam_id: examId,
      student_id: e.student_id,
      subject_id: e.subject_id,
      marks: e.marks,
      grade: calculateGrade(e.marks),
    }));

    return withTransaction((client) => examResultRepository.bulkCreate(client, enrichedEntries));
  },

  async getAll(queryOptions) {
    const { page, limit, offset } = getPagination(queryOptions);
    const [data, total] = await Promise.all([
      examResultRepository.findAll(queryOptions, { limit, offset }),
      examResultRepository.countAll(queryOptions),
    ]);
    return { data, meta: buildMeta({ total, page, limit }) };
  },

  async getById(id) {
    const result = await examResultRepository.findById(id);
    if (!result) throw new AppError('Exam result not found', 404);
    return result;
  },

  async getByExam(examId) {
    const exam = await examRepository.findById(examId);
    if (!exam) throw new AppError('Exam not found', 404);
    return examResultRepository.findByExamId(examId);
  },

  // Marksheet — marks + grade for all subjects of a single exam for a single student
  async getMarksheet(examId, studentId) {
    const exam = await examRepository.findById(examId);
    if (!exam) throw new AppError('Exam not found', 404);

    const student = await studentRepository.findById(studentId);
    if (!student) throw new AppError('Student not found', 404);

    const results = await examResultRepository.findByExamAndStudent(examId, studentId);
    const total = results.reduce((sum, r) => sum + parseFloat(r.marks), 0);

    return { exam, student, results, total_marks: total };
  },

  async update(id, { marks }) {
    const result = await this.getById(id);

    const exam = await examRepository.findById(result.exam_id);
    if (exam.status === 'PUBLISHED') {
      throw new AppError('This exam is published — unpublish it first to modify results', 400);
    }

    marks = assertNumber(marks, 'marks', { min: 0, max: 100 });

    const grade = calculateGrade(marks);
    const updated = await examResultRepository.update(id, { marks, grade });
    if (!updated) throw new AppError('Exam result not found', 404);
    return updated;
  },

  async delete(id) {
    const result = await this.getById(id);

    const exam = await examRepository.findById(result.exam_id);
    if (exam.status === 'PUBLISHED') {
      throw new AppError('This exam is published — unpublish it first to delete results', 400);
    }

    const deleted = await examResultRepository.softDelete(id);
    if (!deleted) throw new AppError('Exam result not found', 404);
    return deleted;
  },

  // ── The core entry point for the auto-trigger hook ──
  // The controller calls this after result entry/bulk-entry — it only reports "whether everything has been entered",
  // the actual decision to trigger the queue is made by the controller/ranking module (this service only provides info,
  // it does not import any queue/job itself — the hook will be placed here once the core/ranking/auto-trigger files are restored)
  async checkAndReportCompletion(examId) {
    const exam = await examRepository.findById(examId);
    if (!exam) throw new AppError('Exam not found', 404);

    const isComplete = await examRepository
      .countStudentsWithResults(examId)
      .then(async (resultCount) => {
        if (!exam.class_id || !exam.academic_session_id) return false;
        const enrolledCount = await examRepository.countEnrolledStudents(
          exam.class_id,
          exam.academic_session_id,
        );
        return enrolledCount > 0 && resultCount >= enrolledCount;
      });

    return { examId, examType: exam.exam_type, isComplete };
  },
};
