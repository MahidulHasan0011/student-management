import { AppError } from './appError.js';

// ─────────────────────────────────────────────────────────────────────────
// shared input validators — no library; on any failure they throw AppError(msg, 400).
// Each assert* returns a normalized value (e.g. trimmed string / number),
// so the caller can use it directly:  const name = assertString(name, 'name', { max: 50 });
//
// required (default true): throws if value is null/undefined.
//   when not required (required:false) and value is null/undefined → returns undefined (skip).
// ─────────────────────────────────────────────────────────────────────────

// enum/CHECK values from the schema — take them from here instead of redefining in each module
export const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
export const EXAM_TYPES = ['ADMISSION', 'MIDTERM', 'FINAL', 'UNIT_TEST'];
export const EXAM_STATUSES = ['DRAFT', 'PUBLISHED'];
export const ENROLLMENT_TYPES = ['OLD', 'NEW'];
export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

const isMissing = (v) => v === undefined || v === null;

// common logic for handling a missing value — throw if required, otherwise undefined
const handleMissing = (field, required) => {
  if (required) throw new AppError(`${field} is required`, 400);
  return undefined;
};

/**
 * string — type + (after trim) non-empty + length range.
 * @returns the trimmed string, or undefined if optional+absent
 */
export function assertString(value, field, { required = true, min = 1, max, trim = true } = {}) {
  if (isMissing(value)) return handleMissing(field, required);
  if (typeof value !== 'string') {
    throw new AppError(`${field} must be a string`, 400);
  }
  const out = trim ? value.trim() : value;
  if (out === '') {
    // provided but blank — if optional, treat it as "not provided"
    if (!required) return undefined;
    throw new AppError(`${field} is required`, 400);
  }
  if (out.length < min) throw new AppError(`${field} must be at least ${min} characters`, 400);
  if (max && out.length > max) throw new AppError(`${field} too long (max ${max} characters)`, 400);
  return out;
}

/** uuid — loose like the Postgres `uuid` type (does not check the version/variant nibble). */
export function assertUuid(value, field, { required = true } = {}) {
  if (isMissing(value)) return handleMissing(field, required);
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw new AppError(`${field} must be a valid id`, 400);
  }
  return value;
}

/** integer — also accepts a "12" string (coerce), then min/max. @returns number */
export function assertInteger(value, field, { required = true, min, max } = {}) {
  if (isMissing(value) || value === '') return handleMissing(field, required);
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n)) throw new AppError(`${field} must be an integer`, 400);
  if (min !== undefined && n < min) throw new AppError(`${field} must be >= ${min}`, 400);
  if (max !== undefined && n > max) throw new AppError(`${field} must be <= ${max}`, 400);
  return n;
}

/** decimal/number — for marks etc. @returns number */
export function assertNumber(value, field, { required = true, min, max } = {}) {
  if (isMissing(value) || value === '') return handleMissing(field, required);
  const n = typeof value === 'number' ? value : Number(value);
  if (typeof n !== 'number' || Number.isNaN(n))
    throw new AppError(`${field} must be a number`, 400);
  if (min !== undefined && n < min) throw new AppError(`${field} must be >= ${min}`, 400);
  if (max !== undefined && n > max) throw new AppError(`${field} must be <= ${max}`, 400);
  return n;
}

/** boolean — strict type check (string "true" is not accepted). @returns boolean */
export function assertBoolean(value, field, { required = true } = {}) {
  if (isMissing(value)) return handleMissing(field, required);
  if (typeof value !== 'boolean') throw new AppError(`${field} must be a boolean`, 400);
  return value;
}

/**
 * date — must be a string and parseable by Date.parse.
 * Date.parse wrongly accepts a number, so typeof string is mandatory.
 * @returns the original string
 */
export function assertDate(value, field, { required = true } = {}) {
  if (isMissing(value) || value === '') return handleMissing(field, required);
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new AppError(`${field} is invalid (use YYYY-MM-DD)`, 400);
  }
  return value;
}

/** start < end — only checked when both are given. */
export function assertDateOrder(
  start,
  end,
  { startField = 'start_date', endField = 'end_date' } = {},
) {
  if (start && end && new Date(start) >= new Date(end)) {
    throw new AppError(`${startField} must be before ${endField}`, 400);
  }
}

/** enum — must be within the allowed list. @returns value */
export function assertEnum(value, field, allowed, { required = true } = {}) {
  if (isMissing(value) || value === '') return handleMissing(field, required);
  if (!allowed.includes(value)) {
    throw new AppError(`${field} must be one of: ${allowed.join(', ')}`, 400);
  }
  return value;
}

/** array — for bulk/assign. @returns array */
export function assertArray(value, field, { required = true, min = 1, max } = {}) {
  if (isMissing(value)) return handleMissing(field, required);
  if (!Array.isArray(value)) throw new AppError(`${field} must be an array`, 400);
  if (value.length < min) throw new AppError(`${field} must have at least ${min} item(s)`, 400);
  if (max && value.length > max) throw new AppError(`${field} must have at most ${max} items`, 400);
  return value;
}
