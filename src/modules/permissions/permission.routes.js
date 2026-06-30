import { Router } from 'express';
import { permissionController } from './permission.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /permissions:
 *   get:
 *     tags: [Permissions]
 *     summary: permission-এর তালিকা (pagination + search)
 *     description: '`PERMISSION_READ` permission লাগে। name-এ search করা যায়।'
 *     parameters:
 *       - { $ref: '#/components/parameters/PageQuery' }
 *       - { $ref: '#/components/parameters/LimitQuery' }
 *       - { name: search, in: query, required: false, schema: { type: string }, description: 'permission name-এ খোঁজা' }
 *       - { name: sortBy, in: query, required: false, schema: { type: string, enum: [name, created_at], default: created_at } }
 *       - { name: sortOrder, in: query, required: false, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200:
 *         description: permission তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Permission' }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/', rbacMiddleware('PERMISSION_READ'), permissionController.getAll);

/**
 * @openapi
 * /permissions/{id}:
 *   get:
 *     tags: [Permissions]
 *     summary: একক permission-এর বিস্তারিত
 *     description: '`PERMISSION_READ` permission লাগে।'
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: permission-এর তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Permission' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', rbacMiddleware('PERMISSION_READ'), permissionController.getById);

/**
 * @openapi
 * /permissions:
 *   post:
 *     tags: [Permissions]
 *     summary: নতুন permission তৈরি
 *     description: '`PERMISSION_CREATE` permission লাগে। name uppercase-এ সংরক্ষিত হয় ও ইউনিক হতে হবে।'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, maxLength: 100, example: STUDENT_CREATE }
 *     responses:
 *       201:
 *         description: permission তৈরি হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Permission' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post('/', rbacMiddleware('PERMISSION_CREATE'), permissionController.create);

/**
 * @openapi
 * /permissions/{id}:
 *   patch:
 *     tags: [Permissions]
 *     summary: permission আপডেট
 *     description: '`PERMISSION_UPDATE` permission লাগে। name হলো একমাত্র updatable ফিল্ড — তাই required।'
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, maxLength: 100 }
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
 *                     data: { $ref: '#/components/schemas/Permission' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.patch('/:id', rbacMiddleware('PERMISSION_UPDATE'), permissionController.update);

/**
 * @openapi
 * /permissions/{id}:
 *   delete:
 *     tags: [Permissions]
 *     summary: permission মুছে ফেলা
 *     description: '`PERMISSION_DELETE` permission লাগে।'
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: permission মুছে ফেলা হয়েছে
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', rbacMiddleware('PERMISSION_DELETE'), permissionController.delete);

export default router;
