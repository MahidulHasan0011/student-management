import { Router } from 'express';
import { rankingController } from './ranking.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

// ── Read ──
/**
 * @openapi
 * /ranking/{classId}/{academicSessionId}:
 *   get:
 *     tags: [Ranking]
 *     summary: একটি ক্লাস ও সেশনের বর্তমান র‍্যাঙ্কিং
 *     description: >-
 *       `RANKING_READ` permission লাগে। cache-first — আগে cache দেখে, না পেলে current ranking snapshot ফেরত দেয়।
 *       class বা academic session না পেলে 404।
 *     parameters:
 *       - { name: classId, in: path, required: true, description: 'ক্লাসের UUID', schema: { type: string, format: uuid } }
 *       - { name: academicSessionId, in: path, required: true, description: 'অ্যাকাডেমিক সেশনের UUID', schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: বর্তমান র‍্যাঙ্কিং তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/RankingEntry' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:classId/:academicSessionId',
  rbacMiddleware('RANKING_READ'),
  rankingController.getRanking,
);

/**
 * @openapi
 * /ranking/{classId}/{academicSessionId}/history:
 *   get:
 *     tags: [Ranking]
 *     summary: র‍্যাঙ্কিং ইতিহাস (snapshot ও version তালিকা)
 *     description: >-
 *       `RANKING_READ` permission লাগে। সব available version এবং (optional) নির্দিষ্ট version-এর snapshots ফেরত দেয়।
 *       `version` query না দিলে সর্বশেষ/সব snapshot আসে।
 *     parameters:
 *       - { name: classId, in: path, required: true, description: 'ক্লাসের UUID', schema: { type: string, format: uuid } }
 *       - { name: academicSessionId, in: path, required: true, description: 'অ্যাকাডেমিক সেশনের UUID', schema: { type: string, format: uuid } }
 *       - { name: version, in: query, required: false, description: 'নির্দিষ্ট version filter', schema: { type: integer } }
 *     responses:
 *       200:
 *         description: ইতিহাস
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
 *                         versions: { type: array, items: { type: object } }
 *                         snapshots: { type: array, items: { $ref: '#/components/schemas/RankingEntry' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:classId/:academicSessionId/history',
  rbacMiddleware('RANKING_READ'),
  rankingController.getHistory,
);

/**
 * @openapi
 * /ranking/{classId}/{academicSessionId}/audit:
 *   get:
 *     tags: [Ranking]
 *     summary: র‍্যাঙ্কিং অডিট লগ
 *     description: >-
 *       `RANKING_READ` permission লাগে। এই ক্লাস ও সেশনের ranking সংক্রান্ত audit log
 *       (generate, unlock, auto-trigger ইত্যাদি action) ফেরত দেয়।
 *     parameters:
 *       - { name: classId, in: path, required: true, description: 'ক্লাসের UUID', schema: { type: string, format: uuid } }
 *       - { name: academicSessionId, in: path, required: true, description: 'অ্যাকাডেমিক সেশনের UUID', schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: অডিট লগ
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { type: object } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:classId/:academicSessionId/audit',
  rbacMiddleware('RANKING_READ'),
  rankingController.getAuditLog,
);

// ── Generate (manual, প্রথমবার) ──
/**
 * @openapi
 * /ranking/generate-roll:
 *   post:
 *     tags: [Ranking]
 *     summary: র‍্যাঙ্ক ও রোল জেনারেশন শুরু করা (manual, প্রথমবার)
 *     description: >-
 *       `RANKING_GENERATE` permission লাগে। background job-এ ranking ও roll generation enqueue করে (202 Accepted)।
 *       ইতিমধ্যে locked থাকলে 409 (তখন recalculate ব্যবহার করতে হবে)।
 *       FINAL exam (এবং সেশনে admission test enabled হলে ADMISSION exam-ও) PUBLISHED না থাকলে 400।
 *       triggeredBy স্বয়ংক্রিয়ভাবে লগইন করা ইউজার থেকে নেওয়া হয়।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, academicSessionId]
 *             properties:
 *               classId: { type: string, format: uuid }
 *               academicSessionId: { type: string, format: uuid }
 *               sectionId: { type: string, format: uuid, description: 'optional — নির্দিষ্ট section-এর জন্য' }
 *     responses:
 *       202:
 *         description: job queue-তে গেছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/RankingJob' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/generate-roll', rbacMiddleware('RANKING_GENERATE'), rankingController.generateRoll);

// ── Admin-only: unlock + recalculate ──
/**
 * @openapi
 * /ranking/recalculate:
 *   post:
 *     tags: [Ranking]
 *     summary: র‍্যাঙ্কিং unlock করে পুনঃগণনা শুরু করা (admin)
 *     description: >-
 *       `RANKING_RECALCULATE` permission লাগে। প্রথমে lock খুলে দেয়, তারপর background job-এ
 *       recalculation + regenerate enqueue করে (202 Accepted) এবং stale cache মুছে দেয়।
 *       FINAL (ও admission test enabled হলে ADMISSION) exam PUBLISHED না থাকলে 400।
 *       triggeredBy স্বয়ংক্রিয়ভাবে লগইন করা ইউজার থেকে নেওয়া হয়।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, academicSessionId]
 *             properties:
 *               classId: { type: string, format: uuid }
 *               academicSessionId: { type: string, format: uuid }
 *               sectionId: { type: string, format: uuid, description: 'optional' }
 *     responses:
 *       202:
 *         description: recalculation শুরু হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/RankingJob' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/recalculate', rbacMiddleware('RANKING_RECALCULATE'), rankingController.recalculate);

/**
 * @openapi
 * /ranking/unlock:
 *   post:
 *     tags: [Ranking]
 *     summary: র‍্যাঙ্কিং lock খুলে দেওয়া (regenerate ছাড়া, admin)
 *     description: >-
 *       `RANKING_UNLOCK` permission লাগে। শুধু lock খুলে দেয় (কোনো recalculation/regenerate ছাড়া) —
 *       admin ম্যানুয়ালি edit করতে চাইলে। class বা session না পেলে 404।
 *       triggeredBy স্বয়ংক্রিয়ভাবে লগইন করা ইউজার থেকে নেওয়া হয়।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, academicSessionId]
 *             properties:
 *               classId: { type: string, format: uuid }
 *               academicSessionId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: unlock সফল
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: object }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/unlock', rbacMiddleware('RANKING_UNLOCK'), rankingController.unlock);

export default router;
