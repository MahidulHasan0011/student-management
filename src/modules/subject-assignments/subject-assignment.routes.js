import { Router } from 'express';
import { subjectAssignmentController } from './subject-assignment.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /assignments:
 *   get:
 *     tags: [Subject-Assignments]
 *     summary: শিক্ষক-বিষয় অ্যাসাইনমেন্টের তালিকা (পেজিনেটেড)
 *     description: '`SUBJECT_ASSIGNMENT_READ` permission লাগে। `teacher_id`, `class_id`, `section_id`, `subject_id`, `academic_session_id` দিয়ে ফিল্টার করা যায়।'
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - { name: teacher_id, in: query, required: false, schema: { type: string, format: uuid } }
 *       - { name: class_id, in: query, required: false, schema: { type: string, format: uuid } }
 *       - { name: section_id, in: query, required: false, schema: { type: string, format: uuid } }
 *       - { name: subject_id, in: query, required: false, schema: { type: string, format: uuid } }
 *       - { name: academic_session_id, in: query, required: false, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: অ্যাসাইনমেন্টের তালিকা (teacher/class/section/subject/session নাম সহ)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/SubjectAssignment' } }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', rbacMiddleware('SUBJECT_ASSIGNMENT_READ'), subjectAssignmentController.getAll);
/**
 * @openapi
 * /assignments/{id}:
 *   get:
 *     tags: [Subject-Assignments]
 *     summary: একটি অ্যাসাইনমেন্টের বিস্তারিত
 *     description: '`SUBJECT_ASSIGNMENT_READ` permission লাগে।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: অ্যাসাইনমেন্টের তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/SubjectAssignment' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', rbacMiddleware('SUBJECT_ASSIGNMENT_READ'), subjectAssignmentController.getById);
/**
 * @openapi
 * /assignments/teacher/{teacherId}:
 *   get:
 *     tags: [Subject-Assignments]
 *     summary: নির্দিষ্ট শিক্ষকের সকল অ্যাসাইনমেন্ট
 *     description: '`SUBJECT_ASSIGNMENT_READ` permission লাগে। শিক্ষক না থাকলে 404।'
 *     parameters:
 *       - name: teacherId
 *         in: path
 *         required: true
 *         description: শিক্ষকের UUID
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: শিক্ষকের অ্যাসাইনমেন্ট তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/SubjectAssignment' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/teacher/:teacherId',
  rbacMiddleware('SUBJECT_ASSIGNMENT_READ'),
  subjectAssignmentController.getByTeacher,
);
/**
 * @openapi
 * /assignments:
 *   post:
 *     tags: [Subject-Assignments]
 *     summary: শিক্ষককে বিষয়/ক্লাস/সেশনে অ্যাসাইন করা
 *     description: >
 *       `SUBJECT_ASSIGNMENT_CREATE` permission লাগে। `assigned_by` লগইন করা অ্যাডমিন থেকে স্বয়ংক্রিয়ভাবে সেট হয়।
 *       ক্লাসে সেকশন থাকলে `section_id` আবশ্যক; সেকশন না থাকলে `section_id` দেওয়া যাবে না।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [teacher_id, class_id, subject_id, academic_session_id]
 *             properties:
 *               teacher_id: { type: string, format: uuid }
 *               class_id: { type: string, format: uuid }
 *               subject_id: { type: string, format: uuid }
 *               academic_session_id: { type: string, format: uuid }
 *               section_id: { type: string, format: uuid, description: 'ক্লাসে সেকশন থাকলে আবশ্যক' }
 *     responses:
 *       201:
 *         description: অ্যাসাইনমেন্ট তৈরি হয়েছে (`other_teachers_on_same_slot` কাউন্ট সহ)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/SubjectAssignment' }
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
router.post('/', rbacMiddleware('SUBJECT_ASSIGNMENT_CREATE'), subjectAssignmentController.create);
/**
 * @openapi
 * /assignments/{id}:
 *   patch:
 *     tags: [Subject-Assignments]
 *     summary: অ্যাসাইনমেন্ট আপডেট (মূলত শিক্ষক reassign)
 *     description: '`SUBJECT_ASSIGNMENT_UPDATE` permission লাগে। সব ফিল্ড ঐচ্ছিক — যেগুলো পাঠানো হবে শুধু সেগুলোই বদলায়।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teacher_id: { type: string, format: uuid }
 *               class_id: { type: string, format: uuid }
 *               section_id: { type: string, format: uuid, nullable: true }
 *               subject_id: { type: string, format: uuid }
 *               academic_session_id: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: অ্যাসাইনমেন্ট আপডেট হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/SubjectAssignment' }
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
router.patch(
  '/:id',
  rbacMiddleware('SUBJECT_ASSIGNMENT_UPDATE'),
  subjectAssignmentController.update,
);
/**
 * @openapi
 * /assignments/{id}:
 *   delete:
 *     tags: [Subject-Assignments]
 *     summary: অ্যাসাইনমেন্ট মুছে ফেলা (soft delete)
 *     description: '`SUBJECT_ASSIGNMENT_DELETE` permission লাগে।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: অ্যাসাইনমেন্ট মুছে ফেলা হয়েছে
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
router.delete(
  '/:id',
  rbacMiddleware('SUBJECT_ASSIGNMENT_DELETE'),
  subjectAssignmentController.delete,
);

export default router;
