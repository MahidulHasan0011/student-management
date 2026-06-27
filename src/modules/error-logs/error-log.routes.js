import { Router } from 'express';
import { errorLogController } from './error-log.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

// error log-এ stack trace ও request context থাকে — তাই শুধু SUPER_ADMIN দেখতে/মুছতে পারবে
router.get('/', rbacMiddleware('SUPER_ADMIN'), errorLogController.getAll);
router.get('/:id', rbacMiddleware('SUPER_ADMIN'), errorLogController.getById);
router.delete('/', rbacMiddleware('SUPER_ADMIN'), errorLogController.clear); // ?before=ISODate দিলে শুধু পুরনোগুলো
router.delete('/:id', rbacMiddleware('SUPER_ADMIN'), errorLogController.delete);

export default router;
