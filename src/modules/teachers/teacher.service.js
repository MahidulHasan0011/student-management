import bcrypt from 'bcryptjs';
import { teacherRepository } from './teacher.repository.js';
import { userRepository } from '../users/user.repository.js';
import { roleRepository } from '../roles/role.repository.js';
import { AppError } from '../../utils/appError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { withTransaction } from '../../config/db.js';
import { env } from '../../config/env.js';

export const teacherService = {
  // একটা teacher তৈরি করা মানে user account + teacher profile — দুটো একসাথে,
  // একটা fail করলে অন্যটাও rollback হওয়া উচিত, তাই withTransaction
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
    if (!full_name || !email || !password) {
      throw new AppError('full_name, email and password are required', 400);
    }

    const existing = await userRepository.findByEmail(email.toLowerCase());
    if (existing) throw new AppError('Email already in use', 409);

    const teacherRole = await roleRepository.findByName('TEACHER');
    if (!teacherRole) {
      throw new AppError('TEACHER role not found — run db:seed first', 500);
    }

    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    return withTransaction(async (client) => {
      const user = await teacherRepository.createUser(client, {
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
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

      return { ...teacher, full_name: full_name.trim(), email: email.toLowerCase().trim() };
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

  // teacher profile + তার সব subject assignment একসাথে
  async getByIdWithAssignments(id) {
    const teacher = await this.getById(id);
    const assignments = await teacherRepository.findAssignments(id);
    return { ...teacher, assignments };
  },

  async update(id, fields) {
    await this.getById(id);
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
