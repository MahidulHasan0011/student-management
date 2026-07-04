import { errorResponse } from '../utils/response.js';
import { errorLogService } from '../modules/error-logs/error-log.service.js';

export const errorMiddleware = (err, req, res, next) => {
  if (err.isOperational) {
    return errorResponse(res, {
      message: err.message,
      errors: err.errors,
      statusCode: err.statusCode,
    });
  }
  // PostgreSQL unique violation
  if (err.code === '23505') {
    return errorResponse(res, {
      message: 'Duplicate entry — record already exists',
      statusCode: 409,
    });
  }
  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return errorResponse(res, { message: 'Referenced record does not exist', statusCode: 400 });
  }
  // PostgreSQL not-null violation
  if (err.code === '23502') {
    return errorResponse(res, { message: `Field "${err.column}" is required`, statusCode: 400 });
  }

  // Reaching here means an unexpected error (not operational, not a known DB code) → log it to the DB
  // fire-and-forget: we don't hold the response waiting for the log to succeed; the log service swallows its own errors
  console.error('UNHANDLED ERROR:', err);
  errorLogService.log(err, req);
  return errorResponse(res, { message: 'Internal server error', statusCode: 500 });
};
