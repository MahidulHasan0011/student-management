import { Router } from 'express';
import { uploadController } from './upload.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware); // সব route-এ JWT লাগবে

// ── write/confirm ──
/**
 * @openapi
 * /uploads/generate-url:
 *   post:
 *     tags: [Uploads]
 *     summary: ধাপ ১ — pre-signed PUT URL তৈরি (UPLOAD_CREATE permission লাগে)
 *     description: >
 *       declared metadata যাচাই করে একটি PENDING upload row বানায় ও S3/MinIO-তে সরাসরি PUT
 *       করার জন্য short-lived pre-signed URL ফেরত দেয়। frontend এই URL-এ ফাইলটি PUT করে,
 *       তারপর `POST /uploads/confirm` কল করে। extension+MIME consistency, category policy
 *       ও size limit এখানেই চেক হয়। প্রয়োজনীয় permission — UPLOAD_CREATE।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [original_name, category, file_size, mime_type]
 *             properties:
 *               original_name:
 *                 type: string
 *                 maxLength: 255
 *                 description: extension সহ আসল ফাইলের নাম
 *                 example: profile.png
 *               category:
 *                 type: string
 *                 enum: [STUDENT_PROFILE, TEACHER_PROFILE, SCHOOL_LOGO, ASSIGNMENT, QUESTION_PAPER, ANSWER_SHEET, EXAM_ATTACHMENT, LEAVE_ATTACHMENT, ATTENDANCE_PROOF, CERTIFICATE, NOTICE_ATTACHMENT, OTHER]
 *                 example: STUDENT_PROFILE
 *               file_size:
 *                 type: integer
 *                 minimum: 1
 *                 description: declared byte size (confirm-এ আসল size আবার যাচাই হয়)
 *                 example: 204800
 *               mime_type:
 *                 type: string
 *                 maxLength: 127
 *                 example: image/png
 *               related_type:
 *                 type: string
 *                 maxLength: 50
 *                 description: ঐচ্ছিক polymorphic link টাইপ
 *                 example: STUDENT
 *               related_id:
 *                 type: string
 *                 format: uuid
 *                 description: ঐচ্ছিক polymorphic link id
 *     responses:
 *       201:
 *         description: upload URL তৈরি হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UploadUrlResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/generate-url', rbacMiddleware('UPLOAD_CREATE'), uploadController.generateUrl);
/**
 * @openapi
 * /uploads/confirm:
 *   post:
 *     tags: [Uploads]
 *     summary: ধাপ ২ — আপলোড নিশ্চিত করা (UPLOAD_CREATE permission লাগে)
 *     description: >
 *       storage-এ object আছে কিনা ও আসল size limit-এর মধ্যে কিনা যাচাই করে status
 *       PENDING → READY করে। idempotent — আগেই READY হলে সেই row-ই ফেরত দেয়। oversize হলে
 *       object purge করে FAILED মার্ক করে 400 দেয়। প্রয়োজনীয় permission — UPLOAD_CREATE।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [upload_id]
 *             properties:
 *               upload_id:
 *                 type: string
 *                 format: uuid
 *                 description: generate-url ধাপে পাওয়া upload_id
 *               checksum:
 *                 type: string
 *                 maxLength: 128
 *                 description: ঐচ্ছিক — client-এর হিসাব করা checksum (না দিলে storage etag ব্যবহৃত হয়)
 *     responses:
 *       200:
 *         description: আপলোড নিশ্চিত হয়েছে (READY upload record)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Upload' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/confirm', rbacMiddleware('UPLOAD_CREATE'), uploadController.confirm);
/**
 * @openapi
 * /uploads/bulk-delete:
 *   post:
 *     tags: [Uploads]
 *     summary: একাধিক ফাইল একসাথে soft-delete (UPLOAD_DELETE permission লাগে)
 *     description: >
 *       প্রতিটি id-এর ownership আলাদাভাবে যাচাই করে soft-delete করে; partial success রিপোর্ট
 *       করে (কোনগুলো মুছল ও কোনগুলো skip হলো)। প্রয়োজনীয় permission — UPLOAD_DELETE।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: bulk delete প্রসেস হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         deleted:
 *                           type: array
 *                           items: { type: string, format: uuid }
 *                         skipped:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id: { type: string, format: uuid }
 *                               reason: { type: string }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/bulk-delete', rbacMiddleware('UPLOAD_DELETE'), uploadController.bulkDelete);

// ── read ── (static আগে, তারপর param)
/**
 * @openapi
 * /uploads:
 *   get:
 *     tags: [Uploads]
 *     summary: আপলোড তালিকা (UPLOAD_READ permission লাগে)
 *     description: >
 *       paginated upload তালিকা। UPLOAD_MANAGE না থাকলে user শুধু নিজের ফাইল দেখে
 *       (uploaded_by filter override হয়)। প্রয়োজনীয় permission — UPLOAD_READ।
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - name: category
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [STUDENT_PROFILE, TEACHER_PROFILE, SCHOOL_LOGO, ASSIGNMENT, QUESTION_PAPER, ANSWER_SHEET, EXAM_ATTACHMENT, LEAVE_ATTACHMENT, ATTENDANCE_PROOF, CERTIFICATE, NOTICE_ATTACHMENT, OTHER]
 *       - name: status
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [PENDING, READY, FAILED] }
 *       - name: uploaded_by
 *         in: query
 *         required: false
 *         schema: { type: string, format: uuid }
 *       - name: related_type
 *         in: query
 *         required: false
 *         schema: { type: string, maxLength: 50 }
 *       - name: related_id
 *         in: query
 *         required: false
 *         schema: { type: string, format: uuid }
 *       - name: search
 *         in: query
 *         required: false
 *         schema: { type: string, maxLength: 255 }
 *     responses:
 *       200:
 *         description: ফাইল তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Upload' }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', rbacMiddleware('UPLOAD_READ'), uploadController.getAll);
/**
 * @openapi
 * /uploads/{id}:
 *   get:
 *     tags: [Uploads]
 *     summary: একটি আপলোডের বিস্তারিত (UPLOAD_READ permission লাগে)
 *     description: >
 *       owner বা UPLOAD_MANAGE থাকা user-ই দেখতে পারে — নাহলে 403। প্রয়োজনীয় permission — UPLOAD_READ।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: ফাইলের তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Upload' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', rbacMiddleware('UPLOAD_READ'), uploadController.getById);
/**
 * @openapi
 * /uploads/{id}/download:
 *   get:
 *     tags: [Uploads]
 *     summary: ডাউনলোডের জন্য pre-signed GET URL (UPLOAD_READ permission লাগে)
 *     description: >
 *       READY ফাইলের জন্য short-lived pre-signed GET URL ফেরত দেয়। ফাইল READY না হলে 409।
 *       owner বা UPLOAD_MANAGE ছাড়া access নেই (403)। প্রয়োজনীয় permission — UPLOAD_READ।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: download URL তৈরি হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         url: { type: string }
 *                         expiresIn: { type: integer, description: URL TTL (সেকেন্ড) }
 *                         original_name: { type: string }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.get('/:id/download', rbacMiddleware('UPLOAD_READ'), uploadController.download);

// ── delete/restore ──
/**
 * @openapi
 * /uploads/{id}:
 *   delete:
 *     tags: [Uploads]
 *     summary: ফাইল soft-delete (UPLOAD_DELETE permission লাগে)
 *     description: >
 *       owner বা UPLOAD_MANAGE থাকা user-ই মুছতে পারে। প্রয়োজনীয় permission — UPLOAD_DELETE।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: ফাইল মুছে ফেলা হয়েছে
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', rbacMiddleware('UPLOAD_DELETE'), uploadController.delete);
/**
 * @openapi
 * /uploads/{id}/restore:
 *   patch:
 *     tags: [Uploads]
 *     summary: soft-deleted ফাইল restore (UPLOAD_RESTORE permission লাগে)
 *     description: >
 *       deleted_at সেট থাকা ফাইল পুনরুদ্ধার করে। ফাইল deleted না হলে 400।
 *       owner বা UPLOAD_MANAGE ছাড়া access নেই (403)। প্রয়োজনীয় permission — UPLOAD_RESTORE।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: ফাইল restore হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Upload' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/restore', rbacMiddleware('UPLOAD_RESTORE'), uploadController.restore);

export default router;
