import { uploadRepository } from './upload.repository.js';
import { storageService } from '../../services/storage.service.js';
import { AppError } from '../../utils/appError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { env } from '../../config/env.js';
import {
  UPLOAD_STATUS,
  AUDIT_ACTIONS,
  buildStorageKey,
  resolveFileType,
} from './upload.constants.js';

// ── helpers ──────────────────────────────────────────────────────────────────

// UPLOAD_MANAGE থাকলে অন্যের ফাইলও দেখা/মোছা যায় (admin override)
const hasManage = (actor) =>
  Array.isArray(actor?.permissions) && actor.permissions.includes('UPLOAD_MANAGE');

// owner নিজে, নাহলে manage permission — কোনোটাই না হলে 403
const assertCanAccess = (row, actor) => {
  if (row.uploaded_by === actor.userId || hasManage(actor)) return;
  throw new AppError('You do not have access to this file', 403);
};

// storage_key বাইরে দেখাই না (internal); বাকি সব ফেরত দিই
const sanitize = (row) => {
  if (!row) return row;
  const { storage_key, ...safe } = row;
  void storage_key;
  return safe;
};

export const uploadService = {
  /**
   * ধাপ ১ — presigned PUT URL। আমরা শুধু PENDING metadata row বানাই;
   * আসল ফাইল frontend সরাসরি S3/R2-তে দেয়। (input ইতিমধ্যে validation-এ normalized)
   */
  async generateUploadUrl(input, actor, ctx = {}) {
    const storage_key = buildStorageKey({
      category: input.category,
      uploadedBy: actor.userId,
      ext: input.extension,
    });

    const row = await uploadRepository.create({
      storage_key,
      original_name: input.original_name,
      mime_type: input.mime_type,
      extension: input.extension,
      file_size: input.file_size, // declared; confirm-এ যাচাই
      category: input.category,
      uploaded_by: actor.userId,
      related_type: input.related_type,
      related_id: input.related_id,
    });

    const uploadUrl = await storageService.getUploadUrl({
      key: storage_key,
      contentType: input.mime_type,
    });

    await uploadRepository.insertAudit({
      upload_id: row.id,
      action: AUDIT_ACTIONS.GENERATE_URL,
      actor_id: actor.userId,
      ip_address: ctx.ip,
      user_agent: ctx.userAgent,
      detail: { category: input.category, declared_size: input.file_size },
    });

    return {
      upload_id: row.id,
      method: 'PUT',
      uploadUrl,
      // frontend ঠিক এই header দিয়ে PUT করবে (ContentType signed)
      headers: { 'Content-Type': input.mime_type },
      expiresIn: env.STORAGE_UPLOAD_URL_TTL,
      storage_key,
    };
  },

  /**
   * ধাপ ২ — confirm। S3-তে object আছে কিনা + আসল size যাচাই করে PENDING→READY।
   * idempotent: আগেই READY হলে সেটাই ফেরত দেয়।
   */
  async confirmUpload({ upload_id, checksum }, actor, ctx = {}) {
    const row = await uploadRepository.findById(upload_id);
    if (!row) throw new AppError('Upload not found', 404);
    assertCanAccess(row, actor);

    if (row.status === UPLOAD_STATUS.READY) return sanitize(row); // already confirmed

    const head = await storageService.headObject(row.storage_key);
    if (!head) {
      await uploadRepository.markFailed(row.id);
      throw new AppError('File was not found in storage — upload may have failed', 400);
    }

    // আসল size limit-এর মধ্যে আছে কিনা (client-এর declared size-এ ভরসা করি না)
    const resolved = resolveFileType(row.extension, row.mime_type);
    if (resolved && head.contentLength > resolved.maxBytes) {
      await storageService.deleteObject(row.storage_key); // oversize ফাইল purge
      await uploadRepository.markFailed(row.id);
      const limitMb = Math.round(resolved.maxBytes / (1024 * 1024));
      throw new AppError(`Uploaded file exceeds the ${limitMb}MB limit`, 400);
    }

    const ready = await uploadRepository.markReady(row.id, {
      file_size: head.contentLength || row.file_size,
      checksum: checksum || head.etag,
      metadata: { etag: head.etag, verified_at: new Date().toISOString() },
    });

    await uploadRepository.insertAudit({
      upload_id: row.id,
      action: AUDIT_ACTIONS.CONFIRM,
      actor_id: actor.userId,
      ip_address: ctx.ip,
      user_agent: ctx.userAgent,
      detail: { actual_size: head.contentLength },
    });

    return sanitize(ready);
  },

  /** list — non-manage user শুধু নিজের ফাইল দেখে (ownership scope জোর করে বসাই)। */
  async list(filters, actor) {
    const queryOptions = { ...filters };
    if (!hasManage(actor)) {
      queryOptions.uploaded_by = actor.userId; // override — অন্যের uploaded_by filter খাটবে না
    }

    const { page, limit, offset } = getPagination(filters);
    const [rows, total] = await Promise.all([
      uploadRepository.findAll(queryOptions, { limit, offset }),
      uploadRepository.countAll(queryOptions),
    ]);
    return { data: rows.map(sanitize), meta: buildMeta({ total, page, limit }) };
  },

  async getById(id, actor) {
    const row = await uploadRepository.findById(id);
    if (!row) throw new AppError('Upload not found', 404);
    assertCanAccess(row, actor);
    return sanitize(row);
  },

  /** secure download — short-lived presigned GET URL (CDN/stream নয়, সরাসরি storage থেকে)। */
  async getDownloadUrl(id, actor, ctx = {}) {
    const row = await uploadRepository.findById(id);
    if (!row) throw new AppError('Upload not found', 404);
    assertCanAccess(row, actor);
    if (row.status !== UPLOAD_STATUS.READY) {
      throw new AppError('File is not ready for download', 409);
    }

    const url = await storageService.getDownloadUrl({
      key: row.storage_key,
      downloadName: row.original_name,
    });

    await uploadRepository.insertAudit({
      upload_id: row.id,
      action: AUDIT_ACTIONS.DOWNLOAD,
      actor_id: actor.userId,
      ip_address: ctx.ip,
      user_agent: ctx.userAgent,
      detail: {},
    });

    return { url, expiresIn: env.STORAGE_DOWNLOAD_URL_TTL, original_name: row.original_name };
  },

  async softDelete(id, actor, ctx = {}) {
    const row = await uploadRepository.findById(id);
    if (!row) throw new AppError('Upload not found', 404);
    assertCanAccess(row, actor);

    await uploadRepository.softDelete(id);
    await uploadRepository.insertAudit({
      upload_id: id,
      action: AUDIT_ACTIONS.DELETE,
      actor_id: actor.userId,
      ip_address: ctx.ip,
      user_agent: ctx.userAgent,
      detail: {},
    });
    return { id };
  },

  async restore(id, actor, ctx = {}) {
    const row = await uploadRepository.findByIdWithDeleted(id);
    if (!row) throw new AppError('Upload not found', 404);
    if (!row.deleted_at) throw new AppError('Upload is not deleted', 400);
    assertCanAccess(row, actor);

    const restored = await uploadRepository.restore(id);
    await uploadRepository.insertAudit({
      upload_id: id,
      action: AUDIT_ACTIONS.RESTORE,
      actor_id: actor.userId,
      ip_address: ctx.ip,
      user_agent: ctx.userAgent,
      detail: {},
    });
    return sanitize(restored);
  },

  /** bulk soft-delete — প্রতিটার ownership আলাদা করে যাচাই, partial success রিপোর্ট। */
  async bulkDelete(ids, actor, ctx = {}) {
    const deleted = [];
    const skipped = [];
    for (const id of ids) {
      try {
        await this.softDelete(id, actor, ctx);
        deleted.push(id);
      } catch (err) {
        skipped.push({ id, reason: err.message });
      }
    }
    return { deleted, skipped };
  },
};
