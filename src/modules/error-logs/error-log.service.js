import { errorLogRepository } from './error-log.repository.js';
import { AppError } from '../../utils/appError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';

// request object থেকে নিরাপদে context তোলে — sensitive header (auth, cookie) বাদ দিয়ে
const buildContext = (req) => {
  if (!req) return null;
  return {
    ip: req.ip,
    userAgent: req.headers?.['user-agent'],
    query: req.query,
    params: req.params,
    // body বড়/sensitive হতে পারে — শুধু থাকলে রাখো, পুরো রাখি না এমন কিছু লাগলে এখানে redact করা যাবে
    body: req.body,
  };
};

export const errorLogService = {
  // global error handler থেকে call হয় — best-effort, কখনো throw করবে না
  // (logging fail করলে আসল request flow যেন ভেঙে না যায়)
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
      // DB-তে log করতে না পারলে অন্তত console-এ ফেলে দাও, কিন্তু request ভাঙবে না
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

  // সব (বা ?before=ISODate-এর আগের) log soft-delete করে, কয়টা মুছলো তা ফেরত দেয়
  async clear({ before } = {}) {
    const count = await errorLogRepository.clear(before || null);
    return { cleared: count };
  },
};
