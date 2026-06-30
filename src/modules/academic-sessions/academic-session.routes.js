import { Router } from 'express';
import { academicSessionController } from './academic-session.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

// নির্দিষ্ট /active route অবশ্যই /:id-এর আগে থাকতে হবে — নাহলে "active"-কে id ভাবে নিবে
/**
 * @openapi
 * /academic-sessions/active:
 *   get:
 *     tags: [Academic-Sessions]
 *     summary: বর্তমান সক্রিয় সেশন
 *     description: '`SESSION_READ` permission লাগে। কোনো সক্রিয় সেশন না থাকলে 404।'
 *     responses:
 *       200:
 *         description: সক্রিয় সেশনের তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/AcademicSession' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/active', rbacMiddleware('SESSION_READ'), academicSessionController.getActive);
/**
 * @openapi
 * /academic-sessions:
 *   get:
 *     tags: [Academic-Sessions]
 *     summary: সকল একাডেমিক সেশনের তালিকা (পেজিনেটেড)
 *     description: '`SESSION_READ` permission লাগে।'
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *     responses:
 *       200:
 *         description: সেশনের তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/AcademicSession' } }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', rbacMiddleware('SESSION_READ'), academicSessionController.getAll);
/**
 * @openapi
 * /academic-sessions/{id}:
 *   get:
 *     tags: [Academic-Sessions]
 *     summary: একটি সেশনের বিস্তারিত
 *     description: '`SESSION_READ` permission লাগে।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: সেশনের তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/AcademicSession' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', rbacMiddleware('SESSION_READ'), academicSessionController.getById);
/**
 * @openapi
 * /academic-sessions:
 *   post:
 *     tags: [Academic-Sessions]
 *     summary: নতুন একাডেমিক সেশন তৈরি
 *     description: '`SESSION_CREATE` permission লাগে। `name` ইউনিক; `start_date` ≤ `end_date` হতে হবে।'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, maxLength: 50, example: '2025-2026' }
 *               start_date: { type: string, format: date, example: '2025-01-01' }
 *               end_date: { type: string, format: date, example: '2025-12-31' }
 *               admission_test_enabled: { type: boolean, example: false }
 *     responses:
 *       201:
 *         description: সেশন তৈরি হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/AcademicSession' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post('/', rbacMiddleware('SESSION_CREATE'), academicSessionController.create);
/**
 * @openapi
 * /academic-sessions/{id}:
 *   patch:
 *     tags: [Academic-Sessions]
 *     summary: সেশন আপডেট
 *     description: '`SESSION_UPDATE` permission লাগে। সব ফিল্ড ঐচ্ছিক। `is_active` এখানে বদলানো যায় না — activate/deactivate route ব্যবহার করুন।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, maxLength: 50, example: '2025-2026' }
 *               start_date: { type: string, format: date }
 *               end_date: { type: string, format: date }
 *     responses:
 *       200:
 *         description: সেশন আপডেট হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/AcademicSession' }
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
router.patch('/:id', rbacMiddleware('SESSION_UPDATE'), academicSessionController.update);
/**
 * @openapi
 * /academic-sessions/{id}:
 *   delete:
 *     tags: [Academic-Sessions]
 *     summary: সেশন মুছে ফেলা (soft delete)
 *     description: '`SESSION_DELETE` permission লাগে। সক্রিয় সেশন মুছা যাবে না — আগে deactivate করতে হবে।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: সেশন মুছে ফেলা হয়েছে
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
router.delete('/:id', rbacMiddleware('SESSION_DELETE'), academicSessionController.delete);
/**
 * @openapi
 * /academic-sessions/{id}/activate:
 *   patch:
 *     tags: [Academic-Sessions]
 *     summary: সেশন সক্রিয় করা
 *     description: '`SESSION_UPDATE` permission লাগে। একসাথে শুধু একটিই সেশন সক্রিয় থাকে — এটি সক্রিয় করলে বাকিগুলো নিষ্ক্রিয় হয় (atomic)।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: সেশন সক্রিয় হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/AcademicSession' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/activate', rbacMiddleware('SESSION_UPDATE'), academicSessionController.activate);
/**
 * @openapi
 * /academic-sessions/{id}/deactivate:
 *   patch:
 *     tags: [Academic-Sessions]
 *     summary: সেশন নিষ্ক্রিয় করা
 *     description: '`SESSION_UPDATE` permission লাগে। ইতিমধ্যে নিষ্ক্রিয় হলে অপরিবর্তিত সেশন ফেরত দেয়।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: সেশন নিষ্ক্রিয় হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/AcademicSession' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  '/:id/deactivate',
  rbacMiddleware('SESSION_UPDATE'),
  academicSessionController.deactivate,
);
/**
 * @openapi
 * /academic-sessions/{id}/admission-test:
 *   patch:
 *     tags: [Academic-Sessions]
 *     summary: সেশনের admission test on/off করা
 *     description: '`SESSION_UPDATE` permission লাগে। `admission_test_enabled` (boolean) আবশ্যক।'
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [admission_test_enabled]
 *             properties:
 *               admission_test_enabled: { type: boolean, example: true }
 *     responses:
 *       200:
 *         description: admission test অবস্থা আপডেট হয়েছে
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/AcademicSession' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  '/:id/admission-test',
  rbacMiddleware('SESSION_UPDATE'),
  academicSessionController.toggleAdmissionTest,
);

export default router;
