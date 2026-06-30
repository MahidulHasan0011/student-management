import { Router } from 'express';
import { studentEnrollmentController } from './student-enrollment.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /enrollments:
 *   get:
 *     tags: [Enrollments]
 *     summary: সকল ভর্তির তালিকা (পেজিনেটেড)
 *     description: '`ENROLLMENT_READ` permission লাগে। `class_id`, `section_id`, `academic_session_id` দিয়ে ফিল্টার এবং `sortBy` (roll_number|created_at) সাপোর্ট করে।'
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - { name: class_id, in: query, required: false, schema: { type: string, format: uuid } }
 *       - { name: section_id, in: query, required: false, schema: { type: string, format: uuid } }
 *       - { name: academic_session_id, in: query, required: false, schema: { type: string, format: uuid } }
 *       - { name: sortBy, in: query, required: false, schema: { type: string, enum: [roll_number, created_at] } }
 *       - { name: sortOrder, in: query, required: false, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200:
 *         description: ভর্তির তালিকা (student/class/section/session নাম সহ)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/Enrollment' } }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', rbacMiddleware('ENROLLMENT_READ'), studentEnrollmentController.getAll);
/**
 * @openapi
 * /enrollments/{id}:
 *   get:
 *     tags: [Enrollments]
 *     summary: একটি ভর্তির বিস্তারিত
 *     description: '`ENROLLMENT_READ` permission লাগে।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: ভর্তির তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Enrollment' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', rbacMiddleware('ENROLLMENT_READ'), studentEnrollmentController.getById);
/**
 * @openapi
 * /enrollments:
 *   post:
 *     tags: [Enrollments]
 *     summary: শিক্ষার্থীকে ক্লাস/সেশনে ভর্তি করা
 *     description: >
 *       `ENROLLMENT_CREATE` permission লাগে। একই শিক্ষার্থী একই সেশনে দুইবার ভর্তি হতে পারবে না।
 *       ক্লাসে সেকশন থাকলে `section_id` আবশ্যক (capacity full হলে আটকাবে); সেকশন না থাকলে `section_id` দেওয়া যাবে না।
 *       `enrollment_type` validate হয় কিন্তু persist হয় না; `roll_number` এখানে সেট হয় না (ranking engine বসায়)।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [student_id, class_id, academic_session_id]
 *             properties:
 *               student_id: { type: string, format: uuid }
 *               class_id: { type: string, format: uuid }
 *               academic_session_id: { type: string, format: uuid }
 *               section_id: { type: string, format: uuid, description: 'ক্লাসে সেকশন থাকলে আবশ্যক' }
 *               enrollment_type: { type: string, enum: [OLD, NEW] }
 *     responses:
 *       201:
 *         description: শিক্ষার্থী ভর্তি হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Enrollment' }
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
router.post('/', rbacMiddleware('ENROLLMENT_CREATE'), studentEnrollmentController.create);
/**
 * @openapi
 * /enrollments/{id}:
 *   patch:
 *     tags: [Enrollments]
 *     summary: ভর্তি আপডেট (ক্লাস/সেকশন ট্রান্সফার)
 *     description: >
 *       `ENROLLMENT_UPDATE` permission লাগে। শুধু `class_id` ও `section_id` বদলানো যায় (উভয়ই ঐচ্ছিক)।
 *       নতুন সেকশনের জন্য capacity আবার যাচাই হয়; `roll_number` এখানে বদলানো যায় না।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               class_id: { type: string, format: uuid }
 *               section_id: { type: string, format: uuid, nullable: true }
 *     responses:
 *       200:
 *         description: ভর্তি আপডেট হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Enrollment' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id', rbacMiddleware('ENROLLMENT_UPDATE'), studentEnrollmentController.update);
/**
 * @openapi
 * /enrollments/{id}:
 *   delete:
 *     tags: [Enrollments]
 *     summary: ভর্তি মুছে ফেলা (soft delete)
 *     description: 'ডিলিটের জন্য `ENROLLMENT_DELETE` নয় — `ENROLLMENT_UPDATE` permission লাগে।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: ভর্তি মুছে ফেলা হয়েছে
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
router.delete('/:id', rbacMiddleware('ENROLLMENT_UPDATE'), studentEnrollmentController.delete);

export default router;
