import { Router } from 'express';
import { sectionController } from './section.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /sections:
 *   get:
 *     tags: [Sections]
 *     summary: সব section-এর তালিকা (pagination + search + filter)
 *     description: |
 *       section-এর পেজিনেটেড তালিকা ফেরত দেয় (class_name সহ)। প্রয়োজনীয় permission — `SECTION_READ`।
 *       `search` দিয়ে name-এ খোঁজা যায়; `class_id` দিয়ে নির্দিষ্ট ক্লাসে filter করা যায়।
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - name: search
 *         in: query
 *         required: false
 *         description: section name-এ keyword search
 *         schema: { type: string }
 *       - name: class_id
 *         in: query
 *         required: false
 *         description: নির্দিষ্ট ক্লাসের section ফিল্টার
 *         schema: { type: string, format: uuid }
 *       - name: sortBy
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [name, max_capacity, created_at], default: created_at }
 *       - name: sortOrder
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: section-এর তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Section' }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', rbacMiddleware('SECTION_READ'), sectionController.getAll);

/**
 * @openapi
 * /sections/{id}:
 *   get:
 *     tags: [Sections]
 *     summary: একটি section-এর বিস্তারিত (ID দিয়ে)
 *     description: নির্দিষ্ট section-এর তথ্য (class_name সহ) ফেরত দেয়। প্রয়োজনীয় permission — `SECTION_READ`।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: section-এর তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Section' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', rbacMiddleware('SECTION_READ'), sectionController.getById);

/**
 * @openapi
 * /sections/{id}/occupancy:
 *   get:
 *     tags: [Sections]
 *     summary: section-এর আসন দখল (occupancy) তথ্য
 *     description: |
 *       section-এর তথ্যের সাথে enrolled_count, available_seats ও is_full ফেরত দেয়।
 *       max_capacity null হলে unlimited ধরা হয়। প্রয়োজনীয় permission — `SECTION_READ`।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: section + occupancy তথ্য
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
 *                         enrolled_count: { type: integer, example: 28 }
 *                         available_seats: { type: integer, nullable: true, example: 12 }
 *                         is_full: { type: boolean, example: false }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/occupancy', rbacMiddleware('SECTION_READ'), sectionController.getOccupancy);

/**
 * @openapi
 * /sections:
 *   post:
 *     tags: [Sections]
 *     summary: নতুন section তৈরি
 *     description: |
 *       একটি ক্লাসের অধীনে নতুন section তৈরি করে। name বড় হাতের অক্ষরে রূপান্তরিত হয়
 *       এবং একই ক্লাসে unique হতে হবে। প্রয়োজনীয় permission — `SECTION_CREATE`।
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [class_id, name]
 *             properties:
 *               class_id: { type: string, format: uuid, example: '11111111-1111-1111-1111-111111111111' }
 *               name: { type: string, maxLength: 20, example: 'A' }
 *               max_capacity: { type: integer, minimum: 1, nullable: true, example: 40 }
 *     responses:
 *       201:
 *         description: section তৈরি হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Section' }
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
router.post('/', rbacMiddleware('SECTION_CREATE'), sectionController.create);

/**
 * @openapi
 * /sections/{id}:
 *   patch:
 *     tags: [Sections]
 *     summary: section আপডেট
 *     description: |
 *       section-এর name ও/অথবা max_capacity আপডেট করে। ইতিমধ্যে enrolled student
 *       সংখ্যার চেয়ে কম max_capacity দেওয়া যাবে না (400)। প্রয়োজনীয় permission — `SECTION_UPDATE`।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, maxLength: 20, example: 'B' }
 *               max_capacity: { type: integer, minimum: 1, example: 45 }
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
 *                     data: { $ref: '#/components/schemas/Section' }
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
router.patch('/:id', rbacMiddleware('SECTION_UPDATE'), sectionController.update);

/**
 * @openapi
 * /sections/{id}:
 *   delete:
 *     tags: [Sections]
 *     summary: section মুছে ফেলা (soft delete)
 *     description: |
 *       section-কে soft-delete করে। কোনো ছাত্র enrolled থাকলে মুছা যাবে না (400)।
 *       প্রয়োজনীয় permission — `SECTION_DELETE`।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: section মুছে ফেলা হয়েছে
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400:
 *         description: ছাত্র enrolled থাকায় মুছা যায়নি
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
router.delete('/:id', rbacMiddleware('SECTION_DELETE'), sectionController.delete);

export default router;
