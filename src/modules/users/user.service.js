import bcrypt from 'bcryptjs';
import { userRepository } from './user.repository.js';
import { roleRepository } from '../roles/role.repository.js';
import { AppError } from '../../utils/appError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { env } from '../../config/env.js';
import { assertString, assertUuid, assertEnum, GENDERS } from '../../utils/validators.js';

export const userService = {
  async create({ full_name, email, password, role_id, gender }) {
    full_name = assertString(full_name, 'full_name', { max: 100 });
    email = assertString(email, 'email', { max: 100 }).toLowerCase();
    password = assertString(password, 'password', { min: 6 });
    role_id = assertUuid(role_id, 'role_id');
    gender = assertEnum(gender, 'gender', GENDERS, { required: false });

    const existing = await userRepository.findByEmail(email);
    if (existing) throw new AppError('Email already in use', 409);

    const role = await roleRepository.findById(role_id);
    if (!role) throw new AppError('Role not found', 404);

    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    return userRepository.create({
      full_name,
      email,
      password: hashedPassword,
      role_id,
      gender,
    });
  },

  async getAll(queryOptions) {
    const { page, limit, offset } = getPagination(queryOptions);
    const [data, total] = await Promise.all([
      userRepository.findAll(queryOptions, { limit, offset }),
      userRepository.countAll(queryOptions),
    ]);
    return { data, meta: buildMeta({ total, page, limit }) };
  },

  async getById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  },

  async update(id, fields) {
    await this.getById(id);

    if (fields.full_name !== undefined) {
      fields.full_name = assertString(fields.full_name, 'full_name', { max: 100 });
    }

    if (fields.gender !== undefined) {
      fields.gender = assertEnum(fields.gender, 'gender', GENDERS, { required: false });
    }

    if (fields.email !== undefined) {
      fields.email = assertString(fields.email, 'email', { max: 100 }).toLowerCase();
      const existing = await userRepository.findByEmail(fields.email);
      if (existing && existing.id !== id) throw new AppError('Email already in use', 409);
    }

    if (fields.role_id !== undefined) {
      fields.role_id = assertUuid(fields.role_id, 'role_id');
      const role = await roleRepository.findById(fields.role_id);
      if (!role) throw new AppError('Role not found', 404);
    }

    const updated = await userRepository.update(id, fields);
    if (!updated) throw new AppError('User not found', 404);
    return updated;
  },

  async changePassword(id, { currentPassword, newPassword }) {
    currentPassword = assertString(currentPassword, 'currentPassword');
    newPassword = assertString(newPassword, 'newPassword', { min: 6 });

    const user = await userRepository.findWithPassword(id);
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);

    const hashed = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await userRepository.updatePassword(id, hashed);
  },

  async resetPassword(id, newPassword) {
    await this.getById(id);
    const hashed = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await userRepository.updatePassword(id, hashed);
  },

  async toggleActive(id, is_active) {
    const updated = await userRepository.toggleActive(id, is_active);
    if (!updated) throw new AppError('User not found', 404);
    return updated;
  },

  async delete(id) {
    const deleted = await userRepository.softDelete(id);
    if (!deleted) throw new AppError('User not found', 404);
    return deleted;
  },
};
