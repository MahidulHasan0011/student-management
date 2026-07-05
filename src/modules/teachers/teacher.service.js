import bcrypt from 'bcryptjs';
import { teacherRepository } from './teacher.repository.js';
import { userRepository } from '../users/user.repository.js';
import { roleRepository } from '../roles/role.repository.js';
import { AppError } from '../../utils/appError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { withTransaction } from '../../config/db.js';
import { env } from '../../config/env.js';
import { assertString, assertEnum, assertDate, GENDERS } from '../../utils/validators.js';

export const teacherService = {
  // Creating a teacher means user account + teacher profile — both together,
  // and if one fails the other should roll back too, hence withTransaction
  async create({
    full_name,
    email,
    password,
    gender,
    phone,
    designation,
    qualification,
    joining_date,
  }) {
    full_name = assertString(full_name, 'full_name', { max: 100 });
    email = assertString(email, 'email', { max: 100 });
    password = assertString(password, 'password', { min: 6 });
    gender = assertEnum(gender, 'gender', GENDERS, { required: false });
    phone = assertString(phone, 'phone', { required: false, max: 20 });
    designation = assertString(designation, 'designation', { required: false, max: 100 });
    qualification = assertString(qualification, 'qualification', { required: false });
    joining_date = assertDate(joining_date, 'joining_date', { required: false });

    const email_lc = email.toLowerCase();

    const existing = await userRepository.findByEmail(email_lc);
    if (existing) throw new AppError('Email already in use', 409);

    const teacherRole = await roleRepository.findByName('TEACHER');
    if (!teacherRole) {
      throw new AppError('TEACHER role not found — run db:seed first', 500);
    }

    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    return withTransaction(async (client) => {
      const user = await teacherRepository.createUser(client, {
        full_name,
        email: email_lc,
        password: hashedPassword,
        role_id: teacherRole.id,
        gender,
      });

      const teacher = await teacherRepository.createTeacherProfile(client, {
        user_id: user.id,
        phone,
        designation,
        qualification,
        joining_date,
      });

      return { ...teacher, full_name, email: email_lc };
    });
  },

  async getAll(queryOptions) {
    const { page, limit, offset } = getPagination(queryOptions);
    const [data, total] = await Promise.all([
      teacherRepository.findAll(queryOptions, { limit, offset }),
      teacherRepository.countAll(queryOptions),
    ]);
    return { data, meta: buildMeta({ total, page, limit }) };
  },

  async getById(id) {
    const teacher = await teacherRepository.findById(id);
    if (!teacher) throw new AppError('Teacher not found', 404);
    return teacher;
  },

  // teacher profile + all of their subject assignments together
  async getByIdWithAssignments(id) {
    const teacher = await this.getById(id);
    const assignments = await teacherRepository.findAssignments(id);
    return { ...teacher, assignments };
  },

  async update(id, fields) {
    await this.getById(id);

    fields.phone = assertString(fields.phone, 'phone', { required: false, max: 20 });
    fields.designation = assertString(fields.designation, 'designation', {
      required: false,
      max: 100,
    });
    fields.qualification = assertString(fields.qualification, 'qualification', { required: false });
    fields.joining_date = assertDate(fields.joining_date, 'joining_date', { required: false });

    const updated = await teacherRepository.update(id, fields);
    if (!updated) throw new AppError('Teacher not found', 404);
    return updated;
  },

  async delete(id) {
    await this.getById(id);

    const hasAssignments = await teacherRepository.hasActiveAssignments(id);
    if (hasAssignments) {
      throw new AppError(
        'Cannot delete teacher — has active subject assignments. Remove assignments first.',
        400,
      );
    }

    const deleted = await teacherRepository.softDelete(id);
    if (!deleted) throw new AppError('Teacher not found', 404);
    return deleted;
  },
};
