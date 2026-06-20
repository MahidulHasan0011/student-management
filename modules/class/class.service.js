import { classRepository } from "./class.repository.js";
import { AppError } from "../../utils/AppError.js";
import { getPagination, buildMeta } from "../../utils/pagination.js";

export const classService = {
  async create({ name }) {
    if (!name) throw new AppError("name is required", 400);

    const existing = await classRepository.findByName(name.trim());
    if (existing) throw new AppError(`Class "${name}" already exists`, 409);

    return classRepository.create({ name: name.trim() });
  },

  async getAll(queryOptions) {
    const { page, limit, offset } = getPagination(queryOptions);
    const [data, total] = await Promise.all([
      classRepository.findAll(queryOptions, { limit, offset }),
      classRepository.countAll(queryOptions),
    ]);
    return { data, meta: buildMeta({ total, page, limit }) };
  },

  async getById(id) {
    const cls = await classRepository.findById(id);
    if (!cls) throw new AppError("Class not found", 404);
    return cls;
  },

  // class + section list — section assign/capacity দেখানোর জন্য
  async getByIdWithSections(id) {
    const cls = await classRepository.findByIdWithSections(id);
    if (!cls) throw new AppError("Class not found", 404);
    return cls;
  },

  async update(id, { name }) {
    await this.getById(id);
    if (name) {
      const existing = await classRepository.findByName(name.trim());
      if (existing && existing.id !== id) throw new AppError(`Class "${name}" already exists`, 409);
    }
    const updated = await classRepository.update(id, { name: name?.trim() });
    if (!updated) throw new AppError("Class not found", 404);
    return updated;
  },

  async delete(id) {
    await this.getById(id);

    const hasSections = await classRepository.hasSections(id);
    if (hasSections) {
      throw new AppError("Cannot delete class — it has sections attached. Delete sections first.", 400);
    }

    const deleted = await classRepository.softDelete(id);
    if (!deleted) throw new AppError("Class not found", 404);
    return deleted;
  },
};