import { Router } from 'express';
import { rolePermissionController } from './role-permission.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

// দেখা — সবার জন্য ROLE_READ যথেষ্ট, আলাদা permission বানানোর দরকার নেই
/**
 * @openapi
 * /role-permissions/role/{roleId}:
 *   get:
 *     tags: [Role-Permissions]
 *     summary: একটি রোলের সব permission দেখা
 *     description: '`ROLE_READ` permission লাগে। নির্দিষ্ট role-এ assign করা permission-এর তালিকা ফেরত দেয়।'
 *     parameters:
 *       - { name: roleId, in: path, required: true, schema: { type: string, format: uuid }, description: 'রোলের UUID' }
 *     responses:
 *       200:
 *         description: রোলের permission তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/RolePermission' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/role/:roleId', rbacMiddleware('ROLE_READ'), rolePermissionController.getByRole);

/**
 * @openapi
 * /role-permissions/permission/{permissionId}:
 *   get:
 *     tags: [Role-Permissions]
 *     summary: একটি permission কোন কোন রোলে আছে দেখা
 *     description: '`ROLE_READ` permission লাগে। নির্দিষ্ট permission যেসব role-এ assign করা সেগুলোর তালিকা ফেরত দেয়।'
 *     parameters:
 *       - { name: permissionId, in: path, required: true, schema: { type: string, format: uuid }, description: 'permission-এর UUID' }
 *     responses:
 *       200:
 *         description: permission-ধারী রোল তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/RolePermission' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get(
  '/permission/:permissionId',
  rbacMiddleware('ROLE_READ'),
  rolePermissionController.getByPermission,
);

// পরিবর্তন — ROLE_UPDATE permission থাকা লাগবে (role.routes.js-এর syncPermissions-এর মতো)
/**
 * @openapi
 * /role-permissions:
 *   post:
 *     tags: [Role-Permissions]
 *     summary: একটি permission একটি রোলে assign করা
 *     description: '`ROLE_UPDATE` permission লাগে। আগে থেকে assign থাকলে 409 দেয়।'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleId, permissionId]
 *             properties:
 *               roleId: { type: string, format: uuid }
 *               permissionId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: permission রোলে assign হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/RolePermission' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post('/', rbacMiddleware('ROLE_UPDATE'), rolePermissionController.assign);

/**
 * @openapi
 * /role-permissions/bulk:
 *   post:
 *     tags: [Role-Permissions]
 *     summary: একসাথে একাধিক permission রোলে assign করা
 *     description: '`ROLE_UPDATE` permission লাগে। প্রতিটি id আলাদাভাবে process হয় — সফলগুলো assigned-এ, ব্যর্থ/ডুপ্লিকেটগুলো skipped-এ রিপোর্ট হয় (partial success)।'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleId, permissionIds]
 *             properties:
 *               roleId: { type: string, format: uuid }
 *               permissionIds:
 *                 type: array
 *                 minItems: 1
 *                 items: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: bulk assignment process সম্পন্ন
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
 *                         assigned: { type: array, items: { $ref: '#/components/schemas/RolePermission' } }
 *                         skipped:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               permissionId: { type: string, format: uuid }
 *                               reason: { type: string }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/bulk', rbacMiddleware('ROLE_UPDATE'), rolePermissionController.assignBulk);

/**
 * @openapi
 * /role-permissions:
 *   delete:
 *     tags: [Role-Permissions]
 *     summary: একটি রোল থেকে একটি permission সরিয়ে দেওয়া
 *     description: '`ROLE_UPDATE` permission লাগে। permission টি assign করা না থাকলে 404 দেয়।'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleId, permissionId]
 *             properties:
 *               roleId: { type: string, format: uuid }
 *               permissionId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: permission রোল থেকে সরানো হয়েছে
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/', rbacMiddleware('ROLE_UPDATE'), rolePermissionController.revoke);

export default router;
