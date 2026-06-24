import { Router } from 'express';
import { controller } from './result.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post('/', rbacMiddleware('SUPER_ADMIN', 'ADMIN'), controller.createResult);
router.get('/', controller.getResults);
router.put('/:id', rbacMiddleware('SUPER_ADMIN', 'ADMIN'), controller.updateResult);
router.delete('/:id', rbacMiddleware('SUPER_ADMIN', 'ADMIN'), controller.deleteResult);

export default router;
