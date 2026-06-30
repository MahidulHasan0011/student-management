import { Router } from 'express';
import { studentController } from './student.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /students:
 *   get:
 *     tags: [Students]
 *     summary: সব ছাত্রের তালিকা (pagination + search)
 *     description: |
 *       ছাত্রদের পেজিনেটেড তালিকা ফেরত দেয়। প্রয়োজনীয় permission — `STUDENT_READ`।
 *       `search` দিয়ে full_name, email, student_code ও guardian_name-এ খোঁজা যায়।
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - name: search
 *         in: query
 *         required: false
 *         description: full_name / email / student_code / guardian_name-এ keyword search
 *         schema: { type: string }
 *       - name: sortBy
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [full_name, student_code, created_at], default: created_at }
 *       - name: sortOrder
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: ছাত্রদের তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Student' }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', rbacMiddleware('STUDENT_READ'), studentController.getAll);

/**
 * @openapi
 * /students/{id}:
 *   get:
 *     tags: [Students]
 *     summary: একজন ছাত্রের বিস্তারিত (ID দিয়ে)
 *     description: নির্দিষ্ট ছাত্রের profile ফেরত দেয়। প্রয়োজনীয় permission — `STUDENT_READ`।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: ছাত্রের তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Student' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', rbacMiddleware('STUDENT_READ'), studentController.getById);

/**
 * @openapi
 * /students/{id}/enrollment:
 *   get:
 *     tags: [Students]
 *     summary: ছাত্রের profile + চলতি সেশনের enrollment
 *     description: |
 *       ছাত্রের profile-এর সাথে active academic session-এর current enrollment
 *       (class, section, roll_number) ফেরত দেয়। প্রয়োজনীয় permission — `STUDENT_READ`।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: ছাত্রের তথ্য সহ current_enrollment
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Student'
 *                         - type: object
 *                           properties:
 *                             current_enrollment:
 *                               type: object
 *                               nullable: true
 *                               properties:
 *                                 enrollment_id: { type: string, format: uuid }
 *                                 roll_number: { type: integer }
 *                                 class_id: { type: string, format: uuid }
 *                                 class_name: { type: string }
 *                                 section_id: { type: string, format: uuid, nullable: true }
 *                                 section_name: { type: string, nullable: true }
 *                                 academic_session_id: { type: string, format: uuid }
 *                                 session_name: { type: string }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/enrollment', rbacMiddleware('STUDENT_READ'), studentController.getWithEnrollment);

/**
 * @openapi
 * /students:
 *   post:
 *     tags: [Students]
 *     summary: নতুন ছাত্র তৈরি (user account + profile)
 *     description: |
 *       একসাথে user account ও student profile তৈরি করে; student_code (STU-YYYY-NNN)
 *       স্বয়ংক্রিয়ভাবে generate হয়। প্রয়োজনীয় permission — `STUDENT_CREATE`।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, password]
 *             properties:
 *               full_name: { type: string, maxLength: 100, example: Rahim Uddin }
 *               email: { type: string, format: email, maxLength: 100, example: rahim@school.com }
 *               password: { type: string, format: password, minLength: 6, example: 'Student@123' }
 *               gender: { type: string, enum: [MALE, FEMALE, OTHER], example: MALE }
 *               date_of_birth: { type: string, format: date, example: '2010-05-12' }
 *               guardian_name: { type: string, maxLength: 100, example: Karim Uddin }
 *               guardian_phone: { type: string, maxLength: 20, example: '01700000000' }
 *               address: { type: string, example: 'Dhaka, Bangladesh' }
 *     responses:
 *       201:
 *         description: ছাত্র তৈরি হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Student' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/', rbacMiddleware('STUDENT_CREATE'), studentController.create);

/**
 * @openapi
 * /students/{id}:
 *   patch:
 *     tags: [Students]
 *     summary: ছাত্রের profile আপডেট
 *     description: |
 *       student profile-এর mutable ফিল্ডগুলো আপডেট করে (user account নয়)।
 *       প্রয়োজনীয় permission — `STUDENT_UPDATE`।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date_of_birth: { type: string, format: date, example: '2010-05-12' }
 *               guardian_name: { type: string, maxLength: 100, example: Karim Uddin }
 *               guardian_phone: { type: string, maxLength: 20, example: '01700000000' }
 *               address: { type: string, example: 'Dhaka, Bangladesh' }
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
 *                     data: { $ref: '#/components/schemas/Student' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id', rbacMiddleware('STUDENT_UPDATE'), studentController.update);

/**
 * @openapi
 * /students/{id}:
 *   delete:
 *     tags: [Students]
 *     summary: ছাত্র মুছে ফেলা (soft delete)
 *     description: |
 *       ছাত্রকে soft-delete করে। enrollment record থাকলে মুছা যাবে না (400)।
 *       প্রয়োজনীয় permission — `STUDENT_DELETE`।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: ছাত্র মুছে ফেলা হয়েছে
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400:
 *         description: enrollment record থাকায় মুছা যায়নি
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', rbacMiddleware('STUDENT_DELETE'), studentController.delete);

export default router;
