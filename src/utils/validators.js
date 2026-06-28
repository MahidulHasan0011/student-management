import { AppError } from './appError.js';

// ─────────────────────────────────────────────────────────────────────────
// shared input validators — library ছাড়া, সব fail হলে AppError(msg, 400) দেয়।
// প্রতিটা assert* normalized value ফেরত দেয় (যেমন trimmed string / number),
// তাই caller সরাসরি ব্যবহার করতে পারে:  const name = assertString(name, 'name', { max: 50 });
//
// required (default true): value null/undefined হলে throw।
//   না দিলে (required:false) এবং value null/undefined → undefined ফেরত (skip)।
// ─────────────────────────────────────────────────────────────────────────

// schema-র enum/CHECK মান — module-এ আলাদা করে না লিখে এখান থেকে নাও
export const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
export const EXAM_TYPES = ['ADMISSION', 'MIDTERM', 'FINAL', 'UNIT_TEST'];
export const EXAM_STATUSES = ['DRAFT', 'PUBLISHED'];
export const ENROLLMENT_TYPES = ['OLD', 'NEW'];
export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

const isMissing = (v) => v === undefined || v === null;

// অনুপস্থিত value handle করার সাধারণ logic — required হলে throw, নাহলে undefined
const handleMissing = (field, required) => {
  if (required) throw new AppError(`${field} is required`, 400);
  return undefined;
};

/**
 * string — type + (trim করে) খালি নয় + length range।
 * @returns trim করা string, বা optional+absent হলে undefined
 */
export function assertString(value, field, { required = true, min = 1, max, trim = true } = {}) {
  if (isMissing(value)) return handleMissing(field, required);
  if (typeof value !== 'string') {
    throw new AppError(`${field} must be a string`, 400);
  }
  const out = trim ? value.trim() : value;
  if (out === '') {
    // provided but blank — optional হলে "দেওয়া হয়নি" ধরে নাও
    if (!required) return undefined;
    throw new AppError(`${field} is required`, 400);
  }
  if (out.length < min) throw new AppError(`${field} must be at least ${min} characters`, 400);
  if (max && out.length > max) throw new AppError(`${field} too long (max ${max} characters)`, 400);
  return out;
}

/** uuid — Postgres `uuid` টাইপের মতো loose (version/variant nibble যাচাই করে না)। */
export function assertUuid(value, field, { required = true } = {}) {
  if (isMissing(value)) return handleMissing(field, required);
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw new AppError(`${field} must be a valid id`, 400);
  }
  return value;
}

/** integer — "12" string-ও মেনে নেয় (coerce), তারপর min/max। @returns number */
export function assertInteger(value, field, { required = true, min, max } = {}) {
  if (isMissing(value) || value === '') return handleMissing(field, required);
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n)) throw new AppError(`${field} must be an integer`, 400);
  if (min !== undefined && n < min) throw new AppError(`${field} must be >= ${min}`, 400);
  if (max !== undefined && n > max) throw new AppError(`${field} must be <= ${max}`, 400);
  return n;
}

/** decimal/number — marks ইত্যাদির জন্য। @returns number */
export function assertNumber(value, field, { required = true, min, max } = {}) {
  if (isMissing(value) || value === '') return handleMissing(field, required);
  const n = typeof value === 'number' ? value : Number(value);
  if (typeof n !== 'number' || Number.isNaN(n))
    throw new AppError(`${field} must be a number`, 400);
  if (min !== undefined && n < min) throw new AppError(`${field} must be >= ${min}`, 400);
  if (max !== undefined && n > max) throw new AppError(`${field} must be <= ${max}`, 400);
  return n;
}

/** boolean — কড়া type check (string "true" মানে না)। @returns boolean */
export function assertBoolean(value, field, { required = true } = {}) {
  if (isMissing(value)) return handleMissing(field, required);
  if (typeof value !== 'boolean') throw new AppError(`${field} must be a boolean`, 400);
  return value;
}

/**
 * date — string ও Date.parse-যোগ্য হতে হবে।
 * number পাঠালে Date.parse ভুলভাবে মেনে নেয়, তাই typeof string বাধ্যতামূলক।
 * @returns মূল string
 */
export function assertDate(value, field, { required = true } = {}) {
  if (isMissing(value) || value === '') return handleMissing(field, required);
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new AppError(`${field} is invalid (use YYYY-MM-DD)`, 400);
  }
  return value;
}

/** start < end — দুটো দিলে তবেই check। */
export function assertDateOrder(
  start,
  end,
  { startField = 'start_date', endField = 'end_date' } = {},
) {
  if (start && end && new Date(start) >= new Date(end)) {
    throw new AppError(`${startField} must be before ${endField}`, 400);
  }
}

/** enum — allowed list-এর মধ্যে থাকতে হবে। @returns value */
export function assertEnum(value, field, allowed, { required = true } = {}) {
  if (isMissing(value) || value === '') return handleMissing(field, required);
  if (!allowed.includes(value)) {
    throw new AppError(`${field} must be one of: ${allowed.join(', ')}`, 400);
  }
  return value;
}

/** array — bulk/assign এর জন্য। @returns array */
export function assertArray(value, field, { required = true, min = 1, max } = {}) {
  if (isMissing(value)) return handleMissing(field, required);
  if (!Array.isArray(value)) throw new AppError(`${field} must be an array`, 400);
  if (value.length < min) throw new AppError(`${field} must have at least ${min} item(s)`, 400);
  if (max && value.length > max) throw new AppError(`${field} must have at most ${max} items`, 400);
  return value;
}
