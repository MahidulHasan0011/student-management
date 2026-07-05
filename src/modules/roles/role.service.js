import { roleRepository } from './role.repository.js';
import { permissionRepository } from '../permissions/permission.repository.js';
import { AppError } from '../../utils/appError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { permissionEngine } from '../../core/permission.engine.js';
import { assertString } from '../../utils/validators.js';

export const roleService = {
  async create({ name }) {
    name = assertString(name, 'name', { max: 50 }).toUpperCase();
    const existing = await roleRepository.findByName(name);
    if (existing) throw new AppError(`Role "${name}" already exists`, 409);
    return roleRepository.create({ name });
  },

  async getAll(queryOptions) {
    const { page, limit, offset } = getPagination(queryOptions);
    const [data, total] = await Promise.all([
      roleRepository.findAll(queryOptions, { limit, offset }),
      roleRepository.countAll(queryOptions),
    ]);
    return { data, meta: buildMeta({ total, page, limit }) };
  },

  async getById(id) {
    const role = await roleRepository.findById(id);
    if (!role) throw new AppError('Role not found', 404);
    return role;
  },

  async update(id, { name }) {
    await this.getById(id);
    // name is the only updatable + NOT NULL column in roles, so it is required on update too
    name = assertString(name, 'name', { max: 50 }).toUpperCase();
    const existing = await roleRepository.findByName(name);
    if (existing && existing.id !== id) throw new AppError(`Role "${name}" already exists`, 409);
    const updated = await roleRepository.update(id, { name });
    if (!updated) throw new AppError('Role not found', 404);
    return updated;
  },

  async syncPermissions(roleId, permissionIds) {
    await this.getById(roleId);
    if (permissionIds.length) {
      const found = await permissionRepository.findByIds(permissionIds);
      if (found.length !== permissionIds.length) {
        throw new AppError('One or more permission IDs are invalid', 400);
      }
    }
    await roleRepository.syncPermissions(roleId, permissionIds);
    await permissionEngine.invalidate(roleId); // cache is now stale, clear it
    return this.getById(roleId);
  },

  // rbac.middleware.js calls this — the actual cache+DB logic now lives in core/permission.engine.js
  async getCachedPermissions(roleId) {
    return permissionEngine.resolvePermissions(roleId);
  },

  async delete(id) {
    const deleted = await roleRepository.softDelete(id);
    if (!deleted) throw new AppError('Role not found', 404);
    await permissionEngine.invalidate(id);
    return deleted;
  },
};
