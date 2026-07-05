import { rolePermissionRepository } from './role-permission.repository.js';
import { roleRepository } from '../roles/role.repository.js';
import { permissionRepository } from '../permissions/permission.repository.js';
import { AppError } from '../../utils/appError.js';
import { permissionEngine } from '../../core/permission.engine.js';
import { assertUuid, assertArray } from '../../utils/validators.js';

export const rolePermissionService = {
  // List all permissions of a role
  async getByRole(roleId) {
    roleId = assertUuid(roleId, 'roleId');
    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);
    return rolePermissionRepository.findByRoleId(roleId);
  },

  // Show which roles a permission belongs to
  async getByPermission(permissionId) {
    permissionId = assertUuid(permissionId, 'permissionId');
    const permission = await permissionRepository.findById(permissionId);
    if (!permission) throw new AppError('Permission not found', 404);
    return rolePermissionRepository.findByPermissionId(permissionId);
  },

  // ── Assign a single permission to a role ──
  async assign(roleId, permissionId) {
    roleId = assertUuid(roleId, 'roleId');
    permissionId = assertUuid(permissionId, 'permissionId');

    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);

    const permission = await permissionRepository.findById(permissionId);
    if (!permission) throw new AppError('Permission not found', 404);

    const active = await rolePermissionRepository.exists(roleId, permissionId);
    if (active) throw new AppError('This permission is already assigned to the role', 409);

    // If a soft-deleted row exists, restore it; otherwise create a new one — to avoid duplicate rows
    const existingAny = await rolePermissionRepository.findAny(roleId, permissionId);
    const result = existingAny
      ? await rolePermissionRepository.restore(existingAny.id)
      : await rolePermissionRepository.create(roleId, permissionId);

    // The cached permissions of everyone holding this role are now stale — clear them
    await permissionEngine.invalidate(roleId);

    return result;
  },

  // ── Remove a single permission from a role ──
  async revoke(roleId, permissionId) {
    roleId = assertUuid(roleId, 'roleId');
    permissionId = assertUuid(permissionId, 'permissionId');

    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);

    const removed = await rolePermissionRepository.softDelete(roleId, permissionId);
    if (!removed) throw new AppError('This permission is not assigned to the role', 404);

    await permissionEngine.invalidate(roleId);
    return removed;
  },

  // Assign multiple permissions at once — for bulk, call assign() in a loop
  // (even if there are duplicate or invalid ids, the rest keep going and failures are reported)
  async assignBulk(roleId, permissionIds) {
    roleId = assertUuid(roleId, 'roleId');
    permissionIds = assertArray(permissionIds, 'permissionIds');

    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);

    const results = { assigned: [], skipped: [] };

    for (const permissionId of permissionIds) {
      try {
        const result = await this.assign(roleId, permissionId);
        results.assigned.push(result);
      } catch (err) {
        results.skipped.push({ permissionId, reason: err.message });
      }
    }

    return results;
  },
};
