import { subjectRepository } from './subject.repository.js';
import { AppError } from '../../utils/appError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';

export const subjectService = {
  async create({ name, code }) {
    if (!name) throw new AppError('name is required', 400);

    const existingName = await subjectRepository.findByName(name.trim());
    if (existingName) throw new AppError(`Subject "${name}" already exists`, 409);

    if (code) {
      const existingCode = await subjectRepository.findByCode(code.trim().toUpperCase());
      if (existingCode) throw new AppError(`Subject code "${code}" already exists`, 409);
    }

    return subjectRepository.create({
      name: name.trim(),
      code: code?.trim().toUpperCase(),
    });
  },

  async getAll(queryOptions) {
    const { page, limit, offset } = getPagination(queryOptions);
    const [data, total] = await Promise.all([
      subjectRepository.findAll(queryOptions, { limit, offset }),
      subjectRepository.countAll(queryOptions),
    ]);
    return { data, meta: buildMeta({ total, page, limit }) };
  },

  async getById(id) {
    const subject = await subjectRepository.findById(id);
    if (!subject) throw new AppError('Subject not found', 404);
    return subject;
  },

  async update(id, { name, code }) {
    await this.getById(id);

    if (name) {
      const existing = await subjectRepository.findByName(name.trim());
      if (existing && existing.id !== id)
        throw new AppError(`Subject "${name}" already exists`, 409);
    }
    if (code) {
      const existing = await subjectRepository.findByCode(code.trim().toUpperCase());
      if (existing && existing.id !== id)
        throw new AppError(`Subject code "${code}" already exists`, 409);
    }

    const updated = await subjectRepository.update(id, {
      name: name?.trim(),
      code: code?.trim().toUpperCase(),
    });
    if (!updated) throw new AppError('Subject not found', 404);
    return updated;
  },

  async delete(id) {
    await this.getById(id);

    const isAssigned = await subjectRepository.isAssignedToTeacher(id);
    if (isAssigned) {
      throw new AppError('Cannot delete subject — it is assigned to one or more teachers', 400);
    }

    const deleted = await subjectRepository.softDelete(id);
    if (!deleted) throw new AppError('Subject not found', 404);
    return deleted;
  },
};
