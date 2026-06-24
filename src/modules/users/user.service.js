import bcrypt from 'bcryptjs';
import { userRepository } from './user.repository.js';
import { roleRepository } from '../roles/role.repository.js';
import { AppError } from '../../utils/appError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { env } from '../../config/env.js';

export const userService = {
  async create({ full_name, email, password, role_id, gender }) {
    if (!full_name || !email || !password || !role_id) {
      throw new AppError('full_name, email, password and role_id are required', 400);
    }

    const existing = await userRepository.findByEmail(email.toLowerCase());
    if (existing) throw new AppError('Email already in use', 409);

    const role = await roleRepository.findById(role_id);
    if (!role) throw new AppError('Role not found', 404);

    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    return userRepository.create({
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
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

    if (fields.email) {
      const existing = await userRepository.findByEmail(fields.email.toLowerCase());
      if (existing && existing.id !== id) throw new AppError('Email already in use', 409);
      fields.email = fields.email.toLowerCase().trim();
    }

    if (fields.role_id) {
      const role = await roleRepository.findById(fields.role_id);
      if (!role) throw new AppError('Role not found', 404);
    }

    const updated = await userRepository.update(id, fields);
    if (!updated) throw new AppError('User not found', 404);
    return updated;
  },

  async changePassword(id, { currentPassword, newPassword }) {
    if (!currentPassword || !newPassword) {
      throw new AppError('currentPassword and newPassword are required', 400);
    }

    const user = await userRepository.findWithPassword(id);
    if (!user) throw new AppError('User not found', 404);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

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
