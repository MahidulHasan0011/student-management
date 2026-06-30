import { Router } from 'express';
import { subjectController } from './subject.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /subjects:
 *   get:
 *     tags: [Subjects]
 *     summary: সকল বিষয়ের তালিকা (পেজিনেটেড)
 *     description: '`SUBJECT_READ` permission লাগে। `name`/`code`-এ search এবং `sortBy` (name|code|created_at), `sortOrder` সাপোর্ট করে।'
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - { name: search, in: query, required: false, schema: { type: string }, description: 'name বা code-এ খোঁজে' }
 *       - { name: sortBy, in: query, required: false, schema: { type: string, enum: [name, code, created_at] } }
 *       - { name: sortOrder, in: query, required: false, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200:
 *         description: বিষয়ের তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/Subject' } }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', rbacMiddleware('SUBJECT_READ'), subjectController.getAll);
/**
 * @openapi
 * /subjects/{id}:
 *   get:
 *     tags: [Subjects]
 *     summary: একটি বিষয়ের বিস্তারিত
 *     description: '`SUBJECT_READ` permission লাগে।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: বিষয়ের তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Subject' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', rbacMiddleware('SUBJECT_READ'), subjectController.getById);
/**
 * @openapi
 * /subjects:
 *   post:
 *     tags: [Subjects]
 *     summary: নতুন বিষয় তৈরি
 *     description: '`SUBJECT_CREATE` permission লাগে। `code` ঐচ্ছিক, দিলে uppercase করে সংরক্ষণ হয়। name/code ইউনিক।'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, maxLength: 100, example: 'Mathematics' }
 *               code: { type: string, maxLength: 20, example: 'MATH' }
 *     responses:
 *       201:
 *         description: বিষয় তৈরি হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Subject' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/', rbacMiddleware('SUBJECT_CREATE'), subjectController.create);
/**
 * @openapi
 * /subjects/{id}:
 *   patch:
 *     tags: [Subjects]
 *     summary: বিষয় আপডেট
 *     description: '`SUBJECT_UPDATE` permission লাগে। সব ফিল্ড ঐচ্ছিক — যেগুলো পাঠানো হবে শুধু সেগুলোই বদলায়।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, maxLength: 100, example: 'Mathematics' }
 *               code: { type: string, maxLength: 20, example: 'MATH' }
 *     responses:
 *       200:
 *         description: বিষয় আপডেট হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Subject' }
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
router.patch('/:id', rbacMiddleware('SUBJECT_UPDATE'), subjectController.update);
/**
 * @openapi
 * /subjects/{id}:
 *   delete:
 *     tags: [Subjects]
 *     summary: বিষয় মুছে ফেলা (soft delete)
 *     description: '`SUBJECT_DELETE` permission লাগে। কোনো শিক্ষকের সাথে assigned থাকলে মুছা যাবে না।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: বিষয় মুছে ফেলা হয়েছে
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
router.delete('/:id', rbacMiddleware('SUBJECT_DELETE'), subjectController.delete);

export default router;
