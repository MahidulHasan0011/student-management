import { Router } from 'express';
import { roleController } from './role.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /roles:
 *   get:
 *     tags: [Roles]
 *     summary: রোলের তালিকা (pagination + search)
 *     description: '`ROLE_READ` permission লাগে। name-এ search করা যায়।'
 *     parameters:
 *       - { $ref: '#/components/parameters/PageQuery' }
 *       - { $ref: '#/components/parameters/LimitQuery' }
 *       - { name: search, in: query, required: false, schema: { type: string }, description: 'role name-এ খোঁজা' }
 *       - { name: sortBy, in: query, required: false, schema: { type: string, enum: [name, created_at], default: created_at } }
 *       - { name: sortOrder, in: query, required: false, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200:
 *         description: রোল তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Role' }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/', rbacMiddleware('ROLE_READ'), roleController.getAll);

/**
 * @openapi
 * /roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: একক রোলের বিস্তারিত
 *     description: '`ROLE_READ` permission লাগে।'
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: রোলের তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Role' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', rbacMiddleware('ROLE_READ'), roleController.getById);

/**
 * @openapi
 * /roles:
 *   post:
 *     tags: [Roles]
 *     summary: নতুন রোল তৈরি
 *     description: '`ROLE_CREATE` permission লাগে। name uppercase-এ সংরক্ষিত হয় ও ইউনিক হতে হবে।'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, maxLength: 50, example: TEACHER }
 *     responses:
 *       201:
 *         description: রোল তৈরি হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Role' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post('/', rbacMiddleware('ROLE_CREATE'), roleController.create);

/**
 * @openapi
 * /roles/{id}:
 *   patch:
 *     tags: [Roles]
 *     summary: রোল আপডেট
 *     description: '`ROLE_UPDATE` permission লাগে। name হলো একমাত্র updatable ফিল্ড — তাই required।'
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, maxLength: 50 }
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
 *                     data: { $ref: '#/components/schemas/Role' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.patch('/:id', rbacMiddleware('ROLE_UPDATE'), roleController.update);

/**
 * @openapi
 * /roles/{id}:
 *   delete:
 *     tags: [Roles]
 *     summary: রোল মুছে ফেলা (soft delete)
 *     description: '`ROLE_DELETE` permission লাগে। মুছলে সংশ্লিষ্ট permission cache invalidate হয়।'
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: রোল মুছে ফেলা হয়েছে
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', rbacMiddleware('ROLE_DELETE'), roleController.delete);

/**
 * @openapi
 * /roles/{id}/permissions:
 *   put:
 *     tags: [Roles]
 *     summary: রোলের permission সম্পূর্ণ সিঙ্ক (replace)
 *     description: '`ROLE_UPDATE` permission লাগে। দেওয়া permissionIds দিয়ে রোলের permission সেট সম্পূর্ণ প্রতিস্থাপন হয়। খালি অ্যারে দিলে সব permission সরে যায়।'
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *                 example: ['11111111-1111-1111-1111-111111111111']
 *     responses:
 *       200:
 *         description: permission সিঙ্ক সফল — আপডেটেড রোল ফেরত
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Role' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id/permissions', rbacMiddleware('ROLE_UPDATE'), roleController.syncPermissions);

export default router;
