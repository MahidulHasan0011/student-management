import { permissionRepository } from "./permission.repository.js";
import { AppError } from "../../utils/AppError.js";
import { getPagination, buildMeta } from "../../utils/pagination.js";

export const permissionService = {
  async create({ name }) {
    if (!name) throw new AppError("name is required", 400);
    const existing = await permissionRepository.findByName(name.toUpperCase());
    if (existing) throw new AppError(`Permission "${name}" already exists`, 409);
    return permissionRepository.create({ name: name.toUpperCase() });
  },

  async getAll(queryOptions) {
    const { page, limit, offset } = getPagination(queryOptions);

    const [data, total] = await Promise.all([
      permissionRepository.findAll(queryOptions, { limit, offset }),
      permissionRepository.countAll(queryOptions),
    ]);

    return { data, meta: buildMeta({ total, page, limit }) };
  },

  async getById(id) {
    const permission = await permissionRepository.findById(id);
    if (!permission) throw new AppError("Permission not found", 404);
    return permission;
  },

  async update(id, { name }) {
    await this.getById(id);
    if (name) {
      const existing = await permissionRepository.findByName(name.toUpperCase());
      if (existing && existing.id !== id) throw new AppError(`Permission "${name}" already exists`, 409);
    }
    const updated = await permissionRepository.update(id, { name: name.toUpperCase() });
    if (!updated) throw new AppError("Permission not found", 404);
    return updated;
  },

  async delete(id) {
    const deleted = await permissionRepository.delete(id);
    if (!deleted) throw new AppError("Permission not found", 404);
    return deleted;
  },
};
