import { errorLogRepository } from './error-log.repository.js';
import { AppError } from '../../utils/appError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';

// safely pulls context from the request object — excluding sensitive headers (auth, cookie)
const buildContext = (req) => {
  if (!req) return null;
  return {
    ip: req.ip,
    userAgent: req.headers?.['user-agent'],
    query: req.query,
    params: req.params,
    // body may be large/sensitive — keep it only if present; if needed, redaction can be added here rather than keeping it all
    body: req.body,
  };
};

export const errorLogService = {
  // called from the global error handler — best-effort, never throws
  // (so that a logging failure doesn't break the actual request flow)
  async log(err, req) {
    try {
      return await errorLogRepository.create({
        name: err?.name,
        message: err?.message || 'Unknown error',
        stack: err?.stack,
        statusCode: err?.statusCode ?? 500,
        isOperational: err?.isOperational ?? false,
        method: req?.method,
        path: req?.originalUrl || req?.url,
        context: buildContext(req),
        userId: req?.user?.userId || null,
      });
    } catch (logErr) {
      // if it can't be logged to the DB, at least dump it to the console, but don't break the request
      console.error('Failed to persist error log:', logErr.message);
      return null;
    }
  },

  async getAll(queryOptions) {
    const { page, limit, offset } = getPagination(queryOptions);
    const [data, total] = await Promise.all([
      errorLogRepository.findAll(queryOptions, { limit, offset }),
      errorLogRepository.countAll(queryOptions),
    ]);
    return { data, meta: buildMeta({ total, page, limit }) };
  },

  async getById(id) {
    const log = await errorLogRepository.findById(id);
    if (!log) throw new AppError('Error log not found', 404);
    return log;
  },

  async delete(id) {
    const deleted = await errorLogRepository.softDelete(id);
    if (!deleted) throw new AppError('Error log not found', 404);
    return deleted;
  },

  // soft-deletes all (or those before ?before=ISODate) logs and returns how many were deleted
  async clear({ before } = {}) {
    const count = await errorLogRepository.clear(before || null);
    return { cleared: count };
  },
};
