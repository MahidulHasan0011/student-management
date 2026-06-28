import { studentEnrollmentRepository } from './student-enrollment.repository.js';
import { studentRepository } from '../students/student.repository.js';
import { classRepository } from '../classes/class.repository.js';
import { sectionRepository } from '../sections/section.repository.js';
import { academicSessionRepository } from '../academic-sessions/academic-session.repository.js';
import { AppError } from '../../utils/appError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { assertUuid, assertEnum, ENROLLMENT_TYPES } from '../../utils/validators.js';

export const studentEnrollmentService = {
  // student_id, class_id, academic_session_id আবশ্যক — section_id ঐচ্ছিক
  // (class-এ section থাকলে section_id দিতেই হবে, না থাকলে দেওয়ার দরকার নেই)
  async create({ student_id, class_id, section_id, academic_session_id, enrollment_type }) {
    student_id = assertUuid(student_id, 'student_id');
    class_id = assertUuid(class_id, 'class_id');
    academic_session_id = assertUuid(academic_session_id, 'academic_session_id');
    section_id = assertUuid(section_id, 'section_id', { required: false });
    // enrollment_type create-এ persist হয় না (repo নেয় না) — তবু input এলে validate করি
    assertEnum(enrollment_type, 'enrollment_type', ENROLLMENT_TYPES, { required: false });

    const student = await studentRepository.findById(student_id);
    if (!student) throw new AppError('Student not found', 404);

    const cls = await classRepository.findById(class_id);
    if (!cls) throw new AppError('Class not found', 404);

    const session = await academicSessionRepository.findById(academic_session_id);
    if (!session) throw new AppError('Academic session not found', 404);

    // একই student একই session-এ দুইবার enroll করতে পারবে না (DB unique constraint-এও আছে,
    // কিন্তু এখানে আগেই চেক করলে স্পষ্ট error message দেওয়া যায়)
    const existing = await studentEnrollmentRepository.findByStudentAndSession(
      student_id,
      academic_session_id,
    );
    if (existing) {
      throw new AppError('This student is already enrolled in this academic session', 409);
    }

    // ── class-এ section আছে কিনা চেক — তোমার rule: "class maybe section or not" ──
    const classSections = await sectionRepository.findByClassId(class_id);
    const classHasSections = classSections.length > 0;

    if (classHasSections) {
      if (!section_id) {
        throw new AppError('This class has sections — section_id is required', 400);
      }

      const section = classSections.find((s) => s.id === section_id);
      if (!section) {
        throw new AppError('section_id does not belong to the given class', 400);
      }

      // capacity check — max_capacity set করা থাকলে full হয়ে গেলে নতুন enroll আটকাও
      if (section.max_capacity != null) {
        const enrolledCount = await sectionRepository.countEnrolledStudents(section_id);
        if (enrolledCount >= section.max_capacity) {
          throw new AppError(
            `Section "${section.name}" is full (${enrolledCount}/${section.max_capacity})`,
            400,
          );
        }
      }
    } else if (section_id) {
      // class-এ section-ই নেই, কিন্তু caller section_id পাঠিয়েছে — ভুল input
      throw new AppError('This class has no sections — section_id should not be provided', 400);
    }

    // roll_number এখানে দেওয়া হয় না — ranking/roll engine পরে বসাবে
    return studentEnrollmentRepository.create({
      student_id,
      class_id,
      section_id: classHasSections ? section_id : null,
      academic_session_id,
    });
  },

  async getAll(queryOptions) {
    const { page, limit, offset } = getPagination(queryOptions);
    const [data, total] = await Promise.all([
      studentEnrollmentRepository.findAll(queryOptions, { limit, offset }),
      studentEnrollmentRepository.countAll(queryOptions),
    ]);
    return { data, meta: buildMeta({ total, page, limit }) };
  },

  async getById(id) {
    const enrollment = await studentEnrollmentRepository.findById(id);
    if (!enrollment) throw new AppError('Enrollment not found', 404);
    return enrollment;
  },

  // section পরিবর্তন (transfer) — capacity আবার চেক হবে নতুন section-এর জন্য
  // roll_number এখানে বদলানো যায় না — ranking/roll engine-ই authoritative (core/roll.engine.js)
  async update(id, { class_id, section_id }) {
    const enrollment = await this.getById(id);

    class_id = assertUuid(class_id, 'class_id', { required: false });
    section_id = assertUuid(section_id, 'section_id', { required: false });

    const targetClassId = class_id || enrollment.class_id;

    if (section_id !== undefined && section_id !== null) {
      const section = await sectionRepository.findById(section_id);
      if (!section || section.class_id !== targetClassId) {
        throw new AppError('section_id does not belong to the target class', 400);
      }

      if (section.max_capacity != null) {
        const enrolledCount = await sectionRepository.countEnrolledStudents(section_id);
        // নিজে যদি already এই section-এ থাকে, তাকে বাদ দিয়ে গোনা উচিত — কিন্তু সরল রাখতে
        // আমরা strictly < ব্যবহার করি (নিজের section বদলালেও এক ঘর বেশি চাইবে না transfer-এ)
        const alreadyHere = enrollment.section_id === section_id;
        if (!alreadyHere && enrolledCount >= section.max_capacity) {
          throw new AppError(`Section "${section.name}" is full`, 400);
        }
      }
    }

    const updated = await studentEnrollmentRepository.update(id, { class_id, section_id });
    if (!updated) throw new AppError('Enrollment not found', 404);
    return updated;
  },

  async delete(id) {
    await this.getById(id);
    const deleted = await studentEnrollmentRepository.softDelete(id);
    if (!deleted) throw new AppError('Enrollment not found', 404);
    return deleted;
  },
};
