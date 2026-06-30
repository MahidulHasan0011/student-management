import { Router } from 'express';
import { userController } from './user.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /users/me/password:
 *   patch:
 *     tags: [Users]
 *     summary: নিজের পাসওয়ার্ড পরিবর্তন
 *     description: লগইন করা ইউজার নিজের পাসওয়ার্ড বদলায়। কোনো বাড়তি permission লাগে না — শুধু auth।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password, minLength: 6 }
 *     responses:
 *       200:
 *         description: পাসওয়ার্ড পরিবর্তন সফল
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/me/password', userController.changePassword);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: ইউজারদের তালিকা (pagination + search + filter)
 *     description: '`USER_READ` permission লাগে। search করে full_name/email-এ, filter করা যায় role_id ও is_active দিয়ে।'
 *     parameters:
 *       - { $ref: '#/components/parameters/PageQuery' }
 *       - { $ref: '#/components/parameters/LimitQuery' }
 *       - { name: search, in: query, required: false, schema: { type: string }, description: 'full_name বা email-এ খোঁজা' }
 *       - { name: role_id, in: query, required: false, schema: { type: string, format: uuid }, description: 'নির্দিষ্ট role-এর ইউজার' }
 *       - { name: is_active, in: query, required: false, schema: { type: boolean }, description: 'সক্রিয়/নিষ্ক্রিয় ফিল্টার' }
 *       - { name: sortBy, in: query, required: false, schema: { type: string, enum: [full_name, email, created_at], default: created_at } }
 *       - { name: sortOrder, in: query, required: false, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200:
 *         description: ইউজার তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/User' }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/', rbacMiddleware('USER_READ'), userController.getAll);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: একক ইউজারের বিস্তারিত
 *     description: '`USER_READ` permission লাগে।'
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: ইউজারের তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', rbacMiddleware('USER_READ'), userController.getById);

/**
 * @openapi
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: নতুন ইউজার তৈরি
 *     description: '`USER_CREATE` permission লাগে। ইমেইল ইউনিক হতে হবে; role_id অবশ্যই বিদ্যমান role হতে হবে।'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, password, role_id]
 *             properties:
 *               full_name: { type: string, maxLength: 100, example: 'Mr. Karim' }
 *               email: { type: string, format: email, maxLength: 100, example: 'karim@school.com' }
 *               password: { type: string, format: password, minLength: 6 }
 *               role_id: { type: string, format: uuid }
 *               gender: { type: string, enum: [MALE, FEMALE, OTHER], default: MALE }
 *     responses:
 *       201:
 *         description: ইউজার তৈরি হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/User' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post('/', rbacMiddleware('USER_CREATE'), userController.create);

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: ইউজার আপডেট (আংশিক)
 *     description: '`USER_UPDATE` permission লাগে। যেসব ফিল্ড পাঠানো হবে শুধু সেগুলোই আপডেট হয়।'
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name: { type: string, maxLength: 100 }
 *               email: { type: string, format: email, maxLength: 100 }
 *               role_id: { type: string, format: uuid }
 *               gender: { type: string, enum: [MALE, FEMALE, OTHER] }
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
 *                     data: { $ref: '#/components/schemas/User' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.patch('/:id', rbacMiddleware('USER_UPDATE'), userController.update);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: ইউজার মুছে ফেলা (soft delete)
 *     description: '`USER_DELETE` permission লাগে। রেকর্ড soft-delete হয় (deleted_at সেট হয়)।'
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: ইউজার মুছে ফেলা হয়েছে
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', rbacMiddleware('USER_DELETE'), userController.delete);

/**
 * @openapi
 * /users/{id}/reset-password:
 *   patch:
 *     tags: [Users]
 *     summary: অন্য ইউজারের পাসওয়ার্ড রিসেট (admin)
 *     description: '`USER_UPDATE` permission লাগে। বর্তমান পাসওয়ার্ড ছাড়াই নতুন পাসওয়ার্ড সেট করা হয়।'
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword: { type: string, format: password, minLength: 6 }
 *     responses:
 *       200:
 *         description: পাসওয়ার্ড রিসেট সফল
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:id/reset-password', rbacMiddleware('USER_UPDATE'), userController.resetPassword);

/**
 * @openapi
 * /users/{id}/toggle-active:
 *   patch:
 *     tags: [Users]
 *     summary: ইউজার সক্রিয়/নিষ্ক্রিয় টগল
 *     description: '`USER_UPDATE` permission লাগে। is_active true/false সেট করা হয়।'
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [is_active]
 *             properties:
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: স্ট্যাটাস পরিবর্তন সফল
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/User' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:id/toggle-active', rbacMiddleware('USER_UPDATE'), userController.toggleActive);

export default router;
