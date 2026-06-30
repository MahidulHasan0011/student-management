import { Router } from 'express';
import { teacherController } from './teacher.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /teachers:
 *   get:
 *     tags: [Teachers]
 *     summary: সব শিক্ষকের তালিকা (pagination + search)
 *     description: |
 *       শিক্ষকদের পেজিনেটেড তালিকা ফেরত দেয়। প্রয়োজনীয় permission — `TEACHER_READ`।
 *       `search` দিয়ে full_name, email ও phone-এ খোঁজা যায়।
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - name: search
 *         in: query
 *         required: false
 *         description: full_name / email / phone-এ keyword search
 *         schema: { type: string }
 *       - name: sortBy
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [full_name, joining_date, created_at], default: created_at }
 *       - name: sortOrder
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: শিক্ষকদের তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Teacher' }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', rbacMiddleware('TEACHER_READ'), teacherController.getAll);

/**
 * @openapi
 * /teachers/{id}:
 *   get:
 *     tags: [Teachers]
 *     summary: একজন শিক্ষকের বিস্তারিত (ID দিয়ে)
 *     description: নির্দিষ্ট শিক্ষকের profile ফেরত দেয়। প্রয়োজনীয় permission — `TEACHER_READ`।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: শিক্ষকের তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Teacher' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', rbacMiddleware('TEACHER_READ'), teacherController.getById);

/**
 * @openapi
 * /teachers/{id}/assignments:
 *   get:
 *     tags: [Teachers]
 *     summary: শিক্ষকের profile + তার subject assignment তালিকা
 *     description: |
 *       শিক্ষকের profile-এর সাথে তার সব subject assignment একসাথে ফেরত দেয়।
 *       প্রয়োজনীয় permission — `TEACHER_READ`।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: শিক্ষকের তথ্য সহ assignments
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Teacher'
 *                         - type: object
 *                           properties:
 *                             assignments:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id: { type: string, format: uuid }
 *                                   class_id: { type: string, format: uuid }
 *                                   class_name: { type: string }
 *                                   section_id: { type: string, format: uuid, nullable: true }
 *                                   section_name: { type: string, nullable: true }
 *                                   subject_id: { type: string, format: uuid }
 *                                   subject_name: { type: string }
 *                                   academic_session_id: { type: string, format: uuid }
 *                                   session_name: { type: string }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id/assignments',
  rbacMiddleware('TEACHER_READ'),
  teacherController.getWithAssignments,
);

/**
 * @openapi
 * /teachers:
 *   post:
 *     tags: [Teachers]
 *     summary: নতুন শিক্ষক তৈরি (user account + profile)
 *     description: |
 *       একসাথে user account ও teacher profile তৈরি করে।
 *       প্রয়োজনীয় permission — `TEACHER_CREATE`।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, password]
 *             properties:
 *               full_name: { type: string, maxLength: 100, example: Mr. Karim }
 *               email: { type: string, format: email, maxLength: 100, example: karim@school.com }
 *               password: { type: string, format: password, minLength: 6, example: 'Teacher@123' }
 *               gender: { type: string, enum: [MALE, FEMALE, OTHER], example: MALE }
 *               phone: { type: string, maxLength: 20, example: '01700000000' }
 *               designation: { type: string, maxLength: 100, example: 'Senior Teacher' }
 *               qualification: { type: string, example: 'M.Sc in Mathematics' }
 *               joining_date: { type: string, format: date, example: '2020-01-15' }
 *     responses:
 *       201:
 *         description: শিক্ষক তৈরি হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Teacher' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/', rbacMiddleware('TEACHER_CREATE'), teacherController.create);

/**
 * @openapi
 * /teachers/{id}:
 *   patch:
 *     tags: [Teachers]
 *     summary: শিক্ষকের profile আপডেট
 *     description: |
 *       teacher profile-এর mutable ফিল্ডগুলো আপডেট করে (user account নয়)।
 *       প্রয়োজনীয় permission — `TEACHER_UPDATE`।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone: { type: string, maxLength: 20, example: '01700000000' }
 *               designation: { type: string, maxLength: 100, example: 'Senior Teacher' }
 *               qualification: { type: string, example: 'M.Sc in Mathematics' }
 *               joining_date: { type: string, format: date, example: '2020-01-15' }
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
 *                     data: { $ref: '#/components/schemas/Teacher' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id', rbacMiddleware('TEACHER_UPDATE'), teacherController.update);

/**
 * @openapi
 * /teachers/{id}:
 *   delete:
 *     tags: [Teachers]
 *     summary: শিক্ষক মুছে ফেলা (soft delete)
 *     description: |
 *       শিক্ষককে soft-delete করে। active subject assignment থাকলে মুছা যাবে না (400)।
 *       প্রয়োজনীয় permission — `TEACHER_DELETE`।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: শিক্ষক মুছে ফেলা হয়েছে
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400:
 *         description: active assignment থাকায় মুছা যায়নি
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
router.delete('/:id', rbacMiddleware('TEACHER_DELETE'), teacherController.delete);

export default router;
