import { Router } from 'express';
import { errorLogController } from './error-log.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

// error log-এ stack trace ও request context থাকে — তাই শুধু SUPER_ADMIN-কে এই permission দেওয়া হয় (seed.sql)
/**
 * @openapi
 * /error-logs:
 *   get:
 *     tags: [Error-Logs]
 *     summary: সার্ভার error log তালিকা (ERROR_LOG_READ permission লাগে)
 *     description: >
 *       paginated error log তালিকা। stack trace ও request context থাকে বলে সাধারণত শুধু
 *       SUPER_ADMIN-এর কাছেই এই permission থাকে। প্রয়োজনীয় permission — ERROR_LOG_READ।
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - name: search
 *         in: query
 *         required: false
 *         description: message ও path-এ খোঁজে
 *         schema: { type: string }
 *       - name: status_code
 *         in: query
 *         required: false
 *         schema: { type: integer, example: 500 }
 *       - name: user_id
 *         in: query
 *         required: false
 *         schema: { type: string, format: uuid }
 *       - name: method
 *         in: query
 *         required: false
 *         schema: { type: string, example: POST }
 *       - name: is_operational
 *         in: query
 *         required: false
 *         schema: { type: boolean }
 *       - name: sortBy
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [created_at, status_code], default: created_at }
 *       - name: sortOrder
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: error log তালিকা
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/ErrorLog' }
 *                     meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', rbacMiddleware('ERROR_LOG_READ'), errorLogController.getAll);
/**
 * @openapi
 * /error-logs/{id}:
 *   get:
 *     tags: [Error-Logs]
 *     summary: একটি error log-এর বিস্তারিত (ERROR_LOG_READ permission লাগে)
 *     description: প্রয়োজনীয় permission — ERROR_LOG_READ।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: error log-এর তথ্য
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/ErrorLog' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', rbacMiddleware('ERROR_LOG_READ'), errorLogController.getById);
/**
 * @openapi
 * /error-logs:
 *   delete:
 *     tags: [Error-Logs]
 *     summary: সব (বা পুরনো) error log clear করা (ERROR_LOG_DELETE permission লাগে)
 *     description: >
 *       সব error log soft-delete করে এবং কয়টি মুছল তা ফেরত দেয়। `?before=ISODate` দিলে শুধু
 *       সেই তারিখের আগের log মোছে। প্রয়োজনীয় permission — ERROR_LOG_DELETE।
 *     parameters:
 *       - name: before
 *         in: query
 *         required: false
 *         description: এই ISO date-time-এর আগে তৈরি হওয়া log-ই শুধু মুছবে
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: log clear হয়েছে
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
 *                         cleared: { type: integer, example: 42 }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/', rbacMiddleware('ERROR_LOG_DELETE'), errorLogController.clear); // ?before=ISODate দিলে শুধু পুরনোগুলো
/**
 * @openapi
 * /error-logs/{id}:
 *   delete:
 *     tags: [Error-Logs]
 *     summary: একটি error log soft-delete (ERROR_LOG_DELETE permission লাগে)
 *     description: প্রয়োজনীয় permission — ERROR_LOG_DELETE।
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: error log মুছে ফেলা হয়েছে
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', rbacMiddleware('ERROR_LOG_DELETE'), errorLogController.delete);

export default router;
