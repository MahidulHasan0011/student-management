import { Router } from 'express';
import { examResultController } from './exam-result.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /results:
 *   get:
 *     tags: [Exam-Results]
 *     summary: পরীক্ষার ফলাফলের তালিকা (paginated, filter সহ)
 *     description: >-
 *       `EXAM_RESULT_READ` permission লাগে। `exam_id`, `student_id`, `subject_id` দিয়ে filter,
 *       এবং `sortBy`/`sortOrder` দিয়ে সাজানো যায়। প্রতিটি result-এ exam, student ও subject-এর নাম যুক্ত থাকে।
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - { name: exam_id, in: query, required: false, schema: { type: string, format: uuid } }
 *       - { name: student_id, in: query, required: false, schema: { type: string, format: uuid } }
 *       - { name: subject_id, in: query, required: false, schema: { type: string, format: uuid } }
 *       - { name: sortBy, in: query, required: false, schema: { type: string, enum: [marks, created_at] } }
 *       - { name: sortOrder, in: query, required: false, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200:
 *         description: ফলাফলের তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/ExamResult' } }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', rbacMiddleware('EXAM_RESULT_READ'), examResultController.getAll);

/**
 * @openapi
 * /results/{id}:
 *   get:
 *     tags: [Exam-Results]
 *     summary: একটি পরীক্ষার ফলাফলের বিস্তারিত
 *     description: '`EXAM_RESULT_READ` permission লাগে। exam, student ও subject নাম সহ একটি result ফেরত দেয়।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: ফলাফলের তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/ExamResult' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', rbacMiddleware('EXAM_RESULT_READ'), examResultController.getById);

/**
 * @openapi
 * /results/exam/{examId}:
 *   get:
 *     tags: [Exam-Results]
 *     summary: একটি পরীক্ষার সব ফলাফল
 *     description: >-
 *       `EXAM_RESULT_READ` permission লাগে। নির্দিষ্ট exam-এর সব subject-ভিত্তিক result
 *       (student ও subject নাম সহ) ফেরত দেয়। exam না পেলে 404।
 *     parameters:
 *       - { name: examId, in: path, required: true, description: 'পরীক্ষার UUID', schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: পরীক্ষার ফলাফল
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/ExamResult' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/exam/:examId', rbacMiddleware('EXAM_RESULT_READ'), examResultController.getByExam);

/**
 * @openapi
 * /results/exam/{examId}/student/{studentId}/marksheet:
 *   get:
 *     tags: [Exam-Results]
 *     summary: একজন ছাত্রের একটি পরীক্ষার মার্কশিট
 *     description: >-
 *       `EXAM_RESULT_READ` permission লাগে। নির্দিষ্ট exam ও student-এর সব subject-এর marks/grade,
 *       সাথে মোট নম্বর (total_marks) ফেরত দেয়। exam বা student না পেলে 404।
 *     parameters:
 *       - { name: examId, in: path, required: true, description: 'পরীক্ষার UUID', schema: { type: string, format: uuid } }
 *       - { name: studentId, in: path, required: true, description: 'ছাত্রের UUID', schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: মার্কশিট
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
 *                         exam: { $ref: '#/components/schemas/Exam' }
 *                         student: { $ref: '#/components/schemas/Student' }
 *                         results: { type: array, items: { $ref: '#/components/schemas/ExamResult' } }
 *                         total_marks: { type: number }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/exam/:examId/student/:studentId/marksheet',
  rbacMiddleware('EXAM_RESULT_READ'),
  examResultController.getMarksheet,
);

/**
 * @openapi
 * /results:
 *   post:
 *     tags: [Exam-Results]
 *     summary: একটি ফলাফল এন্ট্রি (এক ছাত্র, এক subject)
 *     description: >-
 *       `EXAM_RESULT_CREATE` permission লাগে। `marks` 0–100 এর মধ্যে থাকতে হবে; grade স্বয়ংক্রিয়ভাবে নির্ণীত হয়।
 *       exam PUBLISHED হলে এন্ট্রি বন্ধ (আগে unpublish করতে হবে) — 400।
 *       একই exam/student/subject-এর entry আগে থাকলে 409।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [exam_id, student_id, subject_id, marks]
 *             properties:
 *               exam_id: { type: string, format: uuid }
 *               student_id: { type: string, format: uuid }
 *               subject_id: { type: string, format: uuid }
 *               marks: { type: number, minimum: 0, maximum: 100, example: 87.5 }
 *     responses:
 *       201:
 *         description: ফলাফল এন্ট্রি হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/ExamResult' }
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
router.post('/', rbacMiddleware('EXAM_RESULT_CREATE'), examResultController.create);

/**
 * @openapi
 * /results/bulk:
 *   post:
 *     tags: [Exam-Results]
 *     summary: একসাথে অনেক ফলাফল এন্ট্রি (bulk upsert)
 *     description: >-
 *       `EXAM_RESULT_CREATE` permission লাগে। একটি exam-এ অনেক student/subject-এর marks একসাথে বসানো হয় —
 *       (exam, student, subject) আগে থাকলে marks/grade আপডেট হয় (upsert)। exam PUBLISHED হলে 400।
 *       response-এ insert করা results ও completion তথ্য (সব ছাত্রের entry সম্পূর্ণ কিনা) ফেরত আসে।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [examId, entries]
 *             properties:
 *               examId: { type: string, format: uuid }
 *               entries:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [student_id, subject_id, marks]
 *                   properties:
 *                     student_id: { type: string, format: uuid }
 *                     subject_id: { type: string, format: uuid }
 *                     marks: { type: number, minimum: 0, maximum: 100 }
 *     responses:
 *       201:
 *         description: bulk ফলাফল এন্ট্রি হয়েছে
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
 *                         results: { type: array, items: { $ref: '#/components/schemas/ExamResult' } }
 *                         completion:
 *                           type: object
 *                           properties:
 *                             examId: { type: string, format: uuid }
 *                             examType: { type: string }
 *                             isComplete: { type: boolean }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/bulk', rbacMiddleware('EXAM_RESULT_CREATE'), examResultController.bulkCreate);

/**
 * @openapi
 * /results/{id}:
 *   patch:
 *     tags: [Exam-Results]
 *     summary: একটি ফলাফলের marks আপডেট
 *     description: >-
 *       `EXAM_RESULT_UPDATE` permission লাগে। শুধু `marks` আপডেট করা যায় (0–100); grade নতুন করে নির্ণীত হয়।
 *       exam PUBLISHED হলে 400।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [marks]
 *             properties:
 *               marks: { type: number, minimum: 0, maximum: 100 }
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
 *                     data: { $ref: '#/components/schemas/ExamResult' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id', rbacMiddleware('EXAM_RESULT_UPDATE'), examResultController.update);

/**
 * @openapi
 * /results/{id}:
 *   delete:
 *     tags: [Exam-Results]
 *     summary: একটি ফলাফল মুছে ফেলা (soft delete)
 *     description: '`EXAM_RESULT_UPDATE` permission লাগে। exam PUBLISHED হলে মুছা যায় না — 400।'
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
router.delete('/:id', rbacMiddleware('EXAM_RESULT_UPDATE'), examResultController.delete);

export default router;
