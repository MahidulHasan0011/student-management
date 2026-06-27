import { examResultRepository } from './exam-result.repository.js';
import { examRepository } from '../exams/exam.repository.js';
import { studentRepository } from '../students/student.repository.js';
import { subjectRepository } from '../subjects/subject.repository.js';
import { calculateGrade } from '../../utils/grade.js';
import { AppError } from '../../utils/AppError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { withTransaction } from '../../config/db.js';

export const examResultService = {
  async create({ exam_id, student_id, subject_id, marks }) {
    if (!exam_id || !student_id || !subject_id || marks === undefined) {
      throw new AppError('exam_id, student_id, subject_id and marks are required', 400);
    }

    const exam = await examRepository.findById(exam_id);
    if (!exam) throw new AppError('Exam not found', 404);

    // ── Publish হয়ে গেলে সরাসরি create/update বন্ধ — correction আলাদা workflow-এ হবে (পরে) ──
    if (exam.status === 'PUBLISHED') {
      throw new AppError('This exam is published — unpublish it first to modify results', 400);
    }

    const student = await studentRepository.findById(student_id);
    if (!student) throw new AppError('Student not found', 404);

    const subject = await subjectRepository.findById(subject_id);
    if (!subject) throw new AppError('Subject not found', 404);

    if (marks < 0 || marks > 100) {
      throw new AppError('marks must be between 0 and 100', 400);
    }

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

  // একসাথে অনেক ছাত্রের marks entry — teacher সাধারণত এভাবেই কাজ করেন (একটা exam, একটা subject, ক্লাসের সবাই)
  // entries = [{ student_id, subject_id, marks }, ...]
  async bulkCreate(examId, entries) {
    if (!Array.isArray(entries) || !entries.length) {
      throw new AppError('entries must be a non-empty array', 400);
    }

    const exam = await examRepository.findById(examId);
    if (!exam) throw new AppError('Exam not found', 404);

    if (exam.status === 'PUBLISHED') {
      throw new AppError('This exam is published — unpublish it first to modify results', 400);
    }

    for (const entry of entries) {
      if (!entry.student_id || !entry.subject_id || entry.marks === undefined) {
        throw new AppError('Each entry needs student_id, subject_id and marks', 400);
      }
      if (entry.marks < 0 || entry.marks > 100) {
        throw new AppError(`Invalid marks (${entry.marks}) for student ${entry.student_id}`, 400);
      }
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

  // মার্কশিট — একটা ছাত্রের একটা exam-এর সব subject-এর নম্বর + grade
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

    if (marks === undefined) throw new AppError('marks is required', 400);
    if (marks < 0 || marks > 100) throw new AppError('marks must be between 0 and 100', 400);

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

  // ── Auto-trigger hook-এর জন্য মূল entry point ──
  // result entry/bulk-entry শেষে controller এটা কল করবে — শুধু "সব ঢোকানো শেষ কিনা" জানিয়ে দেয়,
  // আসল queue trigger করার সিদ্ধান্ত controller/ranking module নেবে (এই service শুধু তথ্য দেয়,
  // কোনো queue/job নিজে থেকে import করে না — core/ranking/auto-trigger ফাইলগুলো রিস্টোর হলে এখানে hook বসবে)
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
