import { Router } from 'express';
import { errorLogController } from './error-log.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

// error log-এ stack trace ও request context থাকে — তাই শুধু SUPER_ADMIN-কে এই permission দেওয়া হয় (seed.sql)
router.get('/', rbacMiddleware('ERROR_LOG_READ'), errorLogController.getAll);
router.get('/:id', rbacMiddleware('ERROR_LOG_READ'), errorLogController.getById);
router.delete('/', rbacMiddleware('ERROR_LOG_DELETE'), errorLogController.clear); // ?before=ISODate দিলে শুধু পুরনোগুলো
router.delete('/:id', rbacMiddleware('ERROR_LOG_DELETE'), errorLogController.delete);

export default router;
