import { rolePermissionRepository } from './role-permission.repository.js';
import { roleRepository } from '../roles/role.repository.js';
import { permissionRepository } from '../permissions/permission.repository.js';
import { AppError } from '../../utils/appError.js';
import { permissionEngine } from '../../core/permission.engine.js';

export const rolePermissionService = {
  // role-এর সব permission লিস্ট দেখাও
  async getByRole(roleId) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);
    return rolePermissionRepository.findByRoleId(roleId);
  },

  // একটা permission কোন কোন role-এ আছে দেখাও
  async getByPermission(permissionId) {
    const permission = await permissionRepository.findById(permissionId);
    if (!permission) throw new AppError('Permission not found', 404);
    return rolePermissionRepository.findByPermissionId(permissionId);
  },

  // ── একটা মাত্র permission একটা role-এ assign করা ──
  async assign(roleId, permissionId) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);

    const permission = await permissionRepository.findById(permissionId);
    if (!permission) throw new AppError('Permission not found', 404);

    const active = await rolePermissionRepository.exists(roleId, permissionId);
    if (active) throw new AppError('This permission is already assigned to the role', 409);

    // soft-deleted আগের row থাকলে restore করো, না থাকলে নতুন বানাও — duplicate row এড়াতে
    const existingAny = await rolePermissionRepository.findAny(roleId, permissionId);
    const result = existingAny
      ? await rolePermissionRepository.restore(existingAny.id)
      : await rolePermissionRepository.create(roleId, permissionId);

    // এই role-ধারী সবার cached permission stale হয়ে গেলো — clear করো
    await permissionEngine.invalidate(roleId);

    return result;
  },

  // ── একটা মাত্র permission একটা role থেকে সরিয়ে দেওয়া ──
  async revoke(roleId, permissionId) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);

    const removed = await rolePermissionRepository.softDelete(roleId, permissionId);
    if (!removed) throw new AppError('This permission is not assigned to the role', 404);

    await permissionEngine.invalidate(roleId);
    return removed;
  },

  // একসাথে একাধিক permission assign — bulk হলে loop-এ assign() কল করি
  // (duplicate বা invalid id থাকলেও বাকিগুলো চলতে থাকবে, ব্যর্থ হওয়াগুলো রিপোর্ট হবে)
  async assignBulk(roleId, permissionIds) {
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
