import { Router } from 'express';
import { classController } from './class.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /classes:
 *   get:
 *     tags: [Classes]
 *     summary: সব ক্লাসের তালিকা (pagination + search)
 *     description: |
 *       ক্লাসের পেজিনেটেড তালিকা ফেরত দেয়। প্রয়োজনীয় permission — `CLASS_READ`।
 *       `search` দিয়ে name-এ খোঁজা যায়।
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - name: search
 *         in: query
 *         required: false
 *         description: class name-এ keyword search
 *         schema: { type: string }
 *       - name: sortBy
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [name, created_at], default: created_at }
 *       - name: sortOrder
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: ক্লাসের তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Class' }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', rbacMiddleware('CLASS_READ'), classController.getAll);

/**
 * @openapi
 * /classes/{id}:
 *   get:
 *     tags: [Classes]
 *     summary: একটি ক্লাসের বিস্তারিত (ID দিয়ে)
 *     description: নির্দিষ্ট ক্লাসের তথ্য ফেরত দেয়। প্রয়োজনীয় permission — `CLASS_READ`।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: ক্লাসের তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Class' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', rbacMiddleware('CLASS_READ'), classController.getById);

/**
 * @openapi
 * /classes/{id}/sections:
 *   get:
 *     tags: [Classes]
 *     summary: ক্লাসের তথ্য + তার section তালিকা
 *     description: |
 *       ক্লাসের তথ্যের সাথে তার সব section (id, name, max_capacity) একসাথে ফেরত দেয়।
 *       প্রয়োজনীয় permission — `CLASS_READ`।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: ক্লাসের তথ্য সহ sections
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Class'
 *                         - type: object
 *                           properties:
 *                             sections:
 *                               type: array
 *                               items: { $ref: '#/components/schemas/Section' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/sections', rbacMiddleware('CLASS_READ'), classController.getWithSections);

/**
 * @openapi
 * /classes:
 *   post:
 *     tags: [Classes]
 *     summary: নতুন ক্লাস তৈরি
 *     description: একটি নতুন ক্লাস তৈরি করে। নাম unique হতে হবে। প্রয়োজনীয় permission — `CLASS_CREATE`।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, maxLength: 50, example: 'Class Six' }
 *     responses:
 *       201:
 *         description: ক্লাস তৈরি হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Class' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/', rbacMiddleware('CLASS_CREATE'), classController.create);

/**
 * @openapi
 * /classes/{id}:
 *   patch:
 *     tags: [Classes]
 *     summary: ক্লাসের নাম আপডেট
 *     description: |
 *       ক্লাসের নাম আপডেট করে (name একমাত্র updatable ফিল্ড, তাই required)।
 *       নতুন নাম unique হতে হবে। প্রয়োজনীয় permission — `CLASS_UPDATE`।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, maxLength: 50, example: 'Class Seven' }
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
 *                     data: { $ref: '#/components/schemas/Class' }
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
router.patch('/:id', rbacMiddleware('CLASS_UPDATE'), classController.update);

/**
 * @openapi
 * /classes/{id}:
 *   delete:
 *     tags: [Classes]
 *     summary: ক্লাস মুছে ফেলা (soft delete)
 *     description: |
 *       ক্লাসকে soft-delete করে। section attached থাকলে মুছা যাবে না (400)।
 *       প্রয়োজনীয় permission — `CLASS_DELETE`।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: ক্লাস মুছে ফেলা হয়েছে
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400:
 *         description: section attached থাকায় মুছা যায়নি
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
router.delete('/:id', rbacMiddleware('CLASS_DELETE'), classController.delete);

export default router;
