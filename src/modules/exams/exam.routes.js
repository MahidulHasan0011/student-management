import { Router } from 'express';
import { examController } from './exam.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /exams:
 *   get:
 *     tags: [Exams]
 *     summary: পরীক্ষার তালিকা (paginated, filter ও search সহ)
 *     description: >-
 *       `EXAM_READ` permission লাগে। `class_id`, `academic_session_id`, `exam_type` দিয়ে filter,
 *       `search` দিয়ে নাম খোঁজা, এবং `sortBy`/`sortOrder` দিয়ে সাজানো যায়।
 *       প্রতিটি exam-এর সাথে class_name ও session_name যুক্ত থাকে।
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - { name: search, in: query, required: false, schema: { type: string }, description: 'exam নাম দিয়ে খোঁজা' }
 *       - { name: class_id, in: query, required: false, schema: { type: string, format: uuid } }
 *       - { name: academic_session_id, in: query, required: false, schema: { type: string, format: uuid } }
 *       - { name: exam_type, in: query, required: false, schema: { type: string, enum: [ADMISSION, MIDTERM, FINAL, UNIT_TEST] } }
 *       - { name: sortBy, in: query, required: false, schema: { type: string, enum: [name, exam_date, created_at] } }
 *       - { name: sortOrder, in: query, required: false, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200:
 *         description: পরীক্ষার তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/Exam' } }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', rbacMiddleware('EXAM_READ'), examController.getAll);

/**
 * @openapi
 * /exams/{id}:
 *   get:
 *     tags: [Exams]
 *     summary: একটি পরীক্ষার বিস্তারিত
 *     description: '`EXAM_READ` permission লাগে। class_name ও session_name সহ exam ফেরত দেয়।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: পরীক্ষার তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Exam' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', rbacMiddleware('EXAM_READ'), examController.getById);

/**
 * @openapi
 * /exams:
 *   post:
 *     tags: [Exams]
 *     summary: নতুন পরীক্ষা তৈরি
 *     description: >-
 *       `EXAM_CREATE` permission লাগে। শুধু `name` বাধ্যতামূলক; অন্যগুলো optional।
 *       `exam_type` না দিলে ডিফল্ট `ADMISSION` হয়। নতুন exam সবসময় `DRAFT` status-এ তৈরি হয়।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, maxLength: 100, example: 'Annual Final Exam 2026' }
 *               class_id: { type: string, format: uuid }
 *               academic_session_id: { type: string, format: uuid }
 *               exam_date: { type: string, format: date, example: '2026-12-01' }
 *               exam_type: { type: string, enum: [ADMISSION, MIDTERM, FINAL, UNIT_TEST], default: ADMISSION }
 *     responses:
 *       201:
 *         description: পরীক্ষা তৈরি হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Exam' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/', rbacMiddleware('EXAM_CREATE'), examController.create);

/**
 * @openapi
 * /exams/{id}:
 *   patch:
 *     tags: [Exams]
 *     summary: পরীক্ষার তথ্য আপডেট
 *     description: '`EXAM_UPDATE` permission লাগে। যেসব field পাঠানো হবে কেবল সেগুলোই আপডেট হয় (partial)।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, maxLength: 100 }
 *               class_id: { type: string, format: uuid }
 *               academic_session_id: { type: string, format: uuid }
 *               exam_date: { type: string, format: date }
 *               exam_type: { type: string, enum: [ADMISSION, MIDTERM, FINAL, UNIT_TEST] }
 *     responses:
 *       200:
 *         description: আপডেট সফল
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Exam' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id', rbacMiddleware('EXAM_UPDATE'), examController.update);

/**
 * @openapi
 * /exams/{id}:
 *   delete:
 *     tags: [Exams]
 *     summary: পরীক্ষা মুছে ফেলা (soft delete)
 *     description: >-
 *       `EXAM_DELETE` permission লাগে। ইতিমধ্যে result থাকলে মুছা যায় না (আগে result মুছতে হবে) — তখন 400।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: মুছে ফেলা হয়েছে
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', rbacMiddleware('EXAM_DELETE'), examController.delete);

// Publish/unpublish — শুধু এই দুটো কাজের জন্য EXAM_UPDATE permission যথেষ্ট
/**
 * @openapi
 * /exams/{id}/publish:
 *   patch:
 *     tags: [Exams]
 *     summary: পরীক্ষা প্রকাশ করা (DRAFT → PUBLISHED)
 *     description: >-
 *       `EXAM_UPDATE` permission লাগে। publish করতে exam-এ class ও academic session থাকতে হবে এবং
 *       অন্তত একটি result entry থাকতে হবে — নাহলে 400। ইতিমধ্যে PUBLISHED হলে 400।
 *       FINAL বা ADMISSION publish হলে শর্ত মিললে ranking auto-trigger হয়।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: প্রকাশিত exam
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Exam' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/publish', rbacMiddleware('EXAM_UPDATE'), examController.publish);

/**
 * @openapi
 * /exams/{id}/unpublish:
 *   patch:
 *     tags: [Exams]
 *     summary: প্রকাশ বাতিল করে খসড়ায় ফেরানো (PUBLISHED → DRAFT)
 *     description: '`EXAM_UPDATE` permission লাগে। ইতিমধ্যে DRAFT হলে 400।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: খসড়ায় ফেরানো হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Exam' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/unpublish', rbacMiddleware('EXAM_UPDATE'), examController.unpublish);

export default router;
