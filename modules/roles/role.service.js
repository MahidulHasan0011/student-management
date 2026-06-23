import { roleRepository } from "./role.repository.js";
import { permissionRepository } from "../permissions/permission.repository.js";
import { AppError } from "../../utils/AppError.js";
import { getPagination, buildMeta } from "../../utils/pagination.js";
import { permissionEngine } from "../../core/permission.engine.js";

export const roleService = {
async create({ name }) {
    if(!name) throw new AppError("name is required", 400);
    const existing = await roleRepository.findByName(name.toUpperCase());
    if(existing) throw new AppError(`Role "${name}" already exists`, 409);
    return roleRepository.create({ name: name.toUpperCase() });
},

async getAll(queryOptions) {
  const { page, limit, offset } = getPagination(queryOptions);
  const [ data, total ] = await Promise.all([
    roleRepository.findAll(queryOptions, { limit, offset }),
    roleRepository.countAll(queryOptions)
  ]);
  return { data, meta: buildMeta({ total, page, limit }) };
},

async getById(id) {
  const role = await roleRepository.findById(id);
  if (!role) throw new AppError("Role not found", 404);
  return role;
},

async update(id, { name }) {
    await this.getById(id);
    if (name) {
      const existing = await roleRepository.findByName(name.toUpperCase());
      if (existing && existing.id !== id) throw new AppError(`Role "${name}" already exists`, 409);
    }
    const updated = await roleRepository.update(id, { name: name.toUpperCase() });
    if (!updated) throw new AppError("Role not found", 404);
    return updated;
},

async syncPermissions(roleId, permissionIds) {
    await this.getById(roleId);
    if (permissionIds.length) {
      const found = await permissionRepository.findByIds(permissionIds);
      if (found.length !== permissionIds.length) {
        throw new AppError("One or more permission IDs are invalid", 400);
      }
    }
    await roleRepository.syncPermissions(roleId, permissionIds);
    await permissionEngine.invalidate(roleId);  // cache stale হয়ে গেলো, clear করো
    return this.getById(roleId);
},

// rbac.middleware.js এটা কল করে — আসল cache+DB logic এখন core/permission.engine.js-এ
async getCachedPermissions(roleId) {
    return permissionEngine.resolvePermissions(roleId);
},

async delete(id) {
    const deleted = await roleRepository.softDelete(id);
    if (!deleted) throw new AppError("Role not found", 404);
    await permissionEngine.invalidate(id);
    return deleted;
},

};
