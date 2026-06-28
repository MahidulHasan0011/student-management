import { randomUUID } from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// upload.constants — সব allow-list এক জায়গায়। নতুন ফাইল-টাইপ/ক্যাটাগরি যোগ করতে
// শুধু এখানে বদলান; service/validation কোড অপরিবর্তিত থাকবে।
// ─────────────────────────────────────────────────────────────────────────────

const MB = 1024 * 1024;

// upload_category_enum-এর সাথে হুবহু মিল রাখতে হবে (migration 004_uploads.sql)
export const UPLOAD_CATEGORIES = [
  'STUDENT_PROFILE',
  'TEACHER_PROFILE',
  'SCHOOL_LOGO',
  'ASSIGNMENT',
  'QUESTION_PAPER',
  'ANSWER_SHEET',
  'EXAM_ATTACHMENT',
  'LEAVE_ATTACHMENT',
  'ATTENDANCE_PROOF',
  'CERTIFICATE',
  'NOTICE_ATTACHMENT',
  'OTHER',
];

export const UPLOAD_STATUS = { PENDING: 'PENDING', READY: 'READY', FAILED: 'FAILED' };

export const AUDIT_ACTIONS = {
  GENERATE_URL: 'GENERATE_URL',
  CONFIRM: 'CONFIRM',
  DOWNLOAD: 'DOWNLOAD',
  DELETE: 'DELETE',
  RESTORE: 'RESTORE',
};

// ── ফাইল গ্রুপ: প্রতি extension-এর জন্য গ্রহণযোগ্য MIME(গুলো) + গ্রুপভিত্তিক size limit ──
// একই ext-এ একাধিক MIME রাখা হয়েছে কারণ browser/OS ভেদে csv/zip/rar-এর MIME ভিন্ন হয়।
export const FILE_GROUPS = {
  IMAGE: {
    maxBytes: 5 * MB,
    extensions: {
      jpg: ['image/jpeg'],
      jpeg: ['image/jpeg'],
      png: ['image/png'],
      webp: ['image/webp'],
      gif: ['image/gif'],
    },
  },
  DOCUMENT: {
    maxBytes: 25 * MB,
    extensions: {
      pdf: ['application/pdf'],
      doc: ['application/msword'],
      docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      xls: ['application/vnd.ms-excel'],
      xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      csv: ['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/plain'],
      ppt: ['application/vnd.ms-powerpoint'],
      pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      txt: ['text/plain'],
    },
  },
  ARCHIVE: {
    maxBytes: 100 * MB,
    extensions: {
      zip: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
      rar: ['application/vnd.rar', 'application/x-rar-compressed', 'application/octet-stream'],
    },
  },
};

// ── কোন category-তে কোন গ্রুপ allowed (বিজনেস রুল) ──
// যেমন profile/logo শুধু image; assignment-এ doc/image/archive সব চলে।
export const CATEGORY_POLICY = {
  STUDENT_PROFILE: ['IMAGE'],
  TEACHER_PROFILE: ['IMAGE'],
  SCHOOL_LOGO: ['IMAGE'],
  ASSIGNMENT: ['DOCUMENT', 'IMAGE', 'ARCHIVE'],
  QUESTION_PAPER: ['DOCUMENT', 'IMAGE'],
  ANSWER_SHEET: ['DOCUMENT', 'IMAGE', 'ARCHIVE'],
  EXAM_ATTACHMENT: ['DOCUMENT', 'IMAGE', 'ARCHIVE'],
  LEAVE_ATTACHMENT: ['IMAGE', 'DOCUMENT'],
  ATTENDANCE_PROOF: ['IMAGE', 'DOCUMENT'],
  CERTIFICATE: ['IMAGE', 'DOCUMENT'],
  NOTICE_ATTACHMENT: ['IMAGE', 'DOCUMENT', 'ARCHIVE'],
  OTHER: ['IMAGE', 'DOCUMENT', 'ARCHIVE'],
};

// ── helpers ──────────────────────────────────────────────────────────────────

/** extension থেকে normalized form (lowercase, leading dot/whitespace ছাড়া)। */
export const normalizeExt = (ext) =>
  String(ext || '')
    .trim()
    .toLowerCase()
    .replace(/^\./, '');

/**
 * extension + MIME দুটোই একসাথে যাচাই করে কোন গ্রুপে পড়ে তা বলে — anti-spoofing।
 * (ext=png কিন্তু mime=application/zip হলে কোনো গ্রুপেই মিলবে না → null)
 * @returns { group, ext, mime, maxBytes } | null
 */
export const resolveFileType = (extension, mimeType) => {
  const ext = normalizeExt(extension);
  const mime = String(mimeType || '')
    .trim()
    .toLowerCase();
  for (const [group, cfg] of Object.entries(FILE_GROUPS)) {
    const allowedMimes = cfg.extensions[ext];
    if (allowedMimes && allowedMimes.includes(mime)) {
      return { group, ext, mime, maxBytes: cfg.maxBytes };
    }
  }
  return null;
};

/** নির্দিষ্ট category-তে এই গ্রুপ allowed কিনা। */
export const isGroupAllowedForCategory = (category, group) =>
  (CATEGORY_POLICY[category] || []).includes(group);

/**
 * storage key (bucket-এর ভেতরের path) সবসময় backend বানায় — client নয়।
 * ফরম্যাট: category/uploaderId/YYYY/MM/<uuid>.<ext>
 *   → collision নেই, path-traversal নেই, prefix দিয়ে সহজে list/lifecycle করা যায়।
 */
export const buildStorageKey = ({ category, uploadedBy, ext }) => {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${category.toLowerCase()}/${uploadedBy}/${yyyy}/${mm}/${randomUUID()}.${normalizeExt(ext)}`;
};
