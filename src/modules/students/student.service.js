import bcrypt from 'bcryptjs';
import { studentRepository } from './student.repository.js';
import { userRepository } from '../users/user.repository.js';
import { roleRepository } from '../roles/role.repository.js';
import { AppError } from '../../utils/appError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { withTransaction, query } from '../../config/db.js';
import { env } from '../../config/env.js';

// student_code ফরম্যাট: STU-2026-001 (বছর + ক্রমিক নম্বর)
const generateStudentCode = async (client) => {
  const year = new Date().getFullYear();
  const { rows } = await client.query(`SELECT COUNT(*) FROM students WHERE student_code LIKE $1`, [
    `STU-${year}-%`,
  ]);
  const nextSeq = parseInt(rows[0].count) + 1;
  return `STU-${year}-${String(nextSeq).padStart(3, '0')}`;
};

export const studentService = {
  // user account + student profile একসাথে তৈরি — একটা fail করলে rollback (teacher.service.js-এর মতোই pattern)
  async create({
    full_name,
    email,
    password,
    gender,
    date_of_birth,
    guardian_name,
    guardian_phone,
    address,
  }) {
    if (!full_name || !email || !password) {
      throw new AppError('full_name, email and password are required', 400);
    }

    const existing = await userRepository.findByEmail(email.toLowerCase());
    if (existing) throw new AppError('Email already in use', 409);

    const studentRole = await roleRepository.findByName('STUDENT');
    if (!studentRole) {
      throw new AppError('STUDENT role not found — run db:seed first', 500);
    }

    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    return withTransaction(async (client) => {
      const user = await studentRepository.createUser(client, {
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role_id: studentRole.id,
        gender,
      });

      const student_code = await generateStudentCode(client);

      const student = await studentRepository.createStudentProfile(client, {
        user_id: user.id,
        student_code,
        date_of_birth,
        guardian_name,
        guardian_phone,
        address,
      });

      return { ...student, full_name: full_name.trim(), email: email.toLowerCase().trim() };
    });
  },

  async getAll(queryOptions) {
    const { page, limit, offset } = getPagination(queryOptions);
    const [data, total] = await Promise.all([
      studentRepository.findAll(queryOptions, { limit, offset }),
      studentRepository.countAll(queryOptions),
    ]);
    return { data, meta: buildMeta({ total, page, limit }) };
  },

  async getById(id) {
    const student = await studentRepository.findById(id);
    if (!student) throw new AppError('Student not found', 404);
    return student;
  },

  // profile + current session-এর enrollment (class/section/roll) একসাথে
  async getByIdWithEnrollment(id) {
    const student = await this.getById(id);
    const enrollment = await studentRepository.findCurrentEnrollment(id);
    return { ...student, current_enrollment: enrollment };
  },

  async update(id, fields) {
    await this.getById(id);
    const updated = await studentRepository.update(id, fields);
    if (!updated) throw new AppError('Student not found', 404);
    return updated;
  },

  async delete(id) {
    await this.getById(id);

    const hasEnrollments = await studentRepository.hasEnrollments(id);
    if (hasEnrollments) {
      throw new AppError(
        'Cannot delete student — enrollment records exist. Remove enrollments first.',
        400,
      );
    }

    const deleted = await studentRepository.softDelete(id);
    if (!deleted) throw new AppError('Student not found', 404);
    return deleted;
  },
};
