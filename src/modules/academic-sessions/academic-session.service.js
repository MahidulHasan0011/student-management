import { academicSessionRepository } from './academic-session.repository.js';
import { AppError } from '../../utils/appError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { withTransaction } from '../../config/db.js';

// ── ছোট ইনপুট validators (library ছাড়া, সব AppError 400 দেয়) ──────────
// name: string হতে হবে, খালি নয়, varchar(50)-এর মধ্যে
function validateName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new AppError('name is required and must be a non-empty string', 400);
  }
  if (name.trim().length > 50) {
    throw new AppError('name too long (max 50 characters)', 400);
  }
}

// date: দিলে string ও parse-যোগ্য হতে হবে (number পাঠালে Date.parse ভুলভাবে মেনে নেয়, তাই typeof check)
function validateDate(value, field) {
  if (value === undefined || value === null) return;
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new AppError(`${field} is invalid (use YYYY-MM-DD)`, 400);
  }
}

function validateDateOrder(start_date, end_date) {
  if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
    throw new AppError('start_date must be before end_date', 400);
  }
}

export const academicSessionService = {
  async create({ name, start_date, end_date, admission_test_enabled }) {
    validateName(name);
    validateDate(start_date, 'start_date');
    validateDate(end_date, 'end_date');
    validateDateOrder(start_date, end_date);
    if (admission_test_enabled !== undefined && typeof admission_test_enabled !== 'boolean') {
      throw new AppError('admission_test_enabled must be a boolean', 400);
    }

    const existing = await academicSessionRepository.findByName(name.trim());
    if (existing) throw new AppError(`Session "${name}" already exists`, 409);

    return academicSessionRepository.create({
      name: name.trim(),
      start_date,
      end_date,
      admission_test_enabled,
    });
  },

  async getAll(queryOptions) {
    const { page, limit, offset } = getPagination(queryOptions);
    const [data, total] = await Promise.all([
      academicSessionRepository.findAll(queryOptions, { limit, offset }),
      academicSessionRepository.countAll(queryOptions),
    ]);
    return { data, meta: buildMeta({ total, page, limit }) };
  },

  async getById(id) {
    const session = await academicSessionRepository.findById(id);
    if (!session) throw new AppError('Academic session not found', 404);
    return session;
  },

  async getActive() {
    const session = await academicSessionRepository.findActive();
    if (!session) throw new AppError('No active academic session found', 404);
    return session;
  },

  async update(id, fields) {
    await this.getById(id);

    if (fields.name !== undefined) {
      validateName(fields.name);
      const existing = await academicSessionRepository.findByName(fields.name.trim());
      if (existing && existing.id !== id) {
        throw new AppError(`Session "${fields.name}" already exists`, 409);
      }
    }

    validateDate(fields.start_date, 'start_date');
    validateDate(fields.end_date, 'end_date');
    validateDateOrder(fields.start_date, fields.end_date);

    const updated = await academicSessionRepository.update(id, fields);
    if (!updated) throw new AppError('Academic session not found', 404);
    return updated;
  },

  // ── একসাথে শুধু একটাই session active রাখার নিয়ম ────────────
  // নতুনটা activate করার আগে বাকি সব deactivate করতে হবে — transaction-এ atomic
  async activate(id) {
    await this.getById(id); // 404 check

    return withTransaction(async (client) => {
      await academicSessionRepository.deactivateAll(client);
      const activated = await academicSessionRepository.setActive(client, id);
      if (!activated) throw new AppError('Academic session not found', 404);
      return activated;
    });
  },

  async deactivate(id) {
    const session = await this.getById(id);
    if (!session.is_active) return session; // already inactive

    // update() শুধু name/start_date/end_date নেয়, তাই is_active বদলাতে সরাসরি raw query করি
    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `UPDATE academic_sessions SET is_active = false, updated_at = NOW()
         WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
        [id],
      );
      return rows[0];
    });
  },

  // ── Admin admission test on/off করতে পারেন ─────────────────
  async toggleAdmissionTest(id, admission_test_enabled) {
    if (typeof admission_test_enabled !== 'boolean') {
      throw new AppError('admission_test_enabled (boolean) is required', 400);
    }
    await this.getById(id);
    const updated = await academicSessionRepository.toggleAdmissionTest(id, admission_test_enabled);
    if (!updated) throw new AppError('Academic session not found', 404);
    return updated;
  },

  async delete(id) {
    const session = await this.getById(id);
    if (session.is_active) {
      throw new AppError('Cannot delete an active session — deactivate it first', 400);
    }
    const deleted = await academicSessionRepository.softDelete(id);
    if (!deleted) throw new AppError('Academic session not found', 404);
    return deleted;
  },
};
