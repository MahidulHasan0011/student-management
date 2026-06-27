import { subjectAssignmentRepository } from './subject-assignment.repository.js';
import { teacherRepository } from '../teachers/teacher.repository.js';
import { classRepository } from '../classes/class.repository.js';
import { sectionRepository } from '../sections/section.repository.js';
import { subjectRepository } from '../subjects/subject.repository.js';
import { academicSessionRepository } from '../academic-sessions/academic-session.repository.js';
import { AppError } from '../../utils/AppError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';

export const subjectAssignmentService = {
  async create({ teacher_id, class_id, section_id, subject_id, academic_session_id, assigned_by }) {
    if (!teacher_id || !class_id || !subject_id || !academic_session_id) {
      throw new AppError(
        'teacher_id, class_id, subject_id and academic_session_id are required',
        400,
      );
    }

    const teacher = await teacherRepository.findById(teacher_id);
    if (!teacher) throw new AppError('Teacher not found', 404);

    const cls = await classRepository.findById(class_id);
    if (!cls) throw new AppError('Class not found', 404);

    const subject = await subjectRepository.findById(subject_id);
    if (!subject) throw new AppError('Subject not found', 404);

    const session = await academicSessionRepository.findById(academic_session_id);
    if (!session) throw new AppError('Academic session not found', 404);

    // ── class-এ section আছে কিনা — student_enrollment-এর মতোই rule এখানেও প্রযোজ্য ──
    const classSections = await sectionRepository.findByClassId(class_id);
    const classHasSections = classSections.length > 0;

    if (classHasSections) {
      if (!section_id) {
        throw new AppError('This class has sections — section_id is required', 400);
      }
      const validSection = classSections.find((s) => s.id === section_id);
      if (!validSection) {
        throw new AppError('section_id does not belong to the given class', 400);
      }
    } else if (section_id) {
      throw new AppError('This class has no sections — section_id should not be provided', 400);
    }

    const finalSectionId = classHasSections ? section_id : null;

    // ── duplicate check — DB-র unique constraint-এর আগেই স্পষ্ট error দেওয়া ──
    const existing = await subjectAssignmentRepository.findExact({
      teacher_id,
      class_id,
      section_id: finalSectionId,
      subject_id,
      academic_session_id,
    });
    if (existing) {
      throw new AppError(
        'This teacher is already assigned to this exact class/section/subject/session',
        409,
      );
    }

    // ── একই slot-এ অন্য teacher আগে থেকে assigned থাকলে সতর্ক করা (block না, শুধু জানিয়ে দেওয়া) ──
    // স্কুলে কখনো কখনো একই বিষয় দুইজন শিক্ষক ভাগাভাগি করে পড়ান, তাই hard-block না করে info দেওয়া হলো
    const otherTeachers = await subjectAssignmentRepository.findOtherTeacherForSlot({
      class_id,
      section_id: finalSectionId,
      subject_id,
      academic_session_id,
    });

    const created = await subjectAssignmentRepository.create({
      teacher_id,
      class_id,
      section_id: finalSectionId,
      subject_id,
      academic_session_id,
      assigned_by,
    });

    return { ...created, other_teachers_on_same_slot: otherTeachers.length };
  },

  async getAll(queryOptions) {
    const { page, limit, offset } = getPagination(queryOptions);
    const [data, total] = await Promise.all([
      subjectAssignmentRepository.findAll(queryOptions, { limit, offset }),
      subjectAssignmentRepository.countAll(queryOptions),
    ]);
    return { data, meta: buildMeta({ total, page, limit }) };
  },

  async getById(id) {
    const assignment = await subjectAssignmentRepository.findById(id);
    if (!assignment) throw new AppError('Subject assignment not found', 404);
    return assignment;
  },

  async getByTeacher(teacherId) {
    const teacher = await teacherRepository.findById(teacherId);
    if (!teacher) throw new AppError('Teacher not found', 404);
    return subjectAssignmentRepository.findByTeacherId(teacherId);
  },

  // assignment বদলানো মানে মূলত teacher reassign করা — অন্য field বদলালে নতুন assignment বানানোই ভালো,
  // কিন্তু flexibility-র জন্য আংশিক update সাপোর্ট করা হলো
  async update(id, fields) {
    const assignment = await this.getById(id);

    if (fields.teacher_id) {
      const teacher = await teacherRepository.findById(fields.teacher_id);
      if (!teacher) throw new AppError('Teacher not found', 404);
    }

    // duplicate চেক — বদলানো ফিল্ডসহ চূড়ান্ত combination যদি অন্য কোনো assignment-এর সাথে মিলে যায়
    const merged = { ...assignment, ...fields };
    const existing = await subjectAssignmentRepository.findExact({
      teacher_id: merged.teacher_id,
      class_id: merged.class_id,
      section_id: merged.section_id,
      subject_id: merged.subject_id,
      academic_session_id: merged.academic_session_id,
    });
    if (existing && existing.id !== id) {
      throw new AppError('Another assignment already exists with this exact combination', 409);
    }

    const updated = await subjectAssignmentRepository.update(id, fields);
    if (!updated) throw new AppError('Subject assignment not found', 404);
    return updated;
  },

  async delete(id) {
    await this.getById(id);
    const deleted = await subjectAssignmentRepository.softDelete(id);
    if (!deleted) throw new AppError('Subject assignment not found', 404);
    return deleted;
  },
};
