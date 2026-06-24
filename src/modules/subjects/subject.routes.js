import { Router } from 'express';
import { subjectController } from './subject.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', rbacMiddleware('ADMIN', 'SUPER_ADMIN'), subjectController.getAll);
router.get('/:id', rbacMiddleware('ADMIN', 'SUPER_ADMIN'), subjectController.getById);
router.post('/', rbacMiddleware('ADMIN', 'SUPER_ADMIN'), subjectController.create);
router.patch('/:id', rbacMiddleware('ADMIN', 'SUPER_ADMIN'), subjectController.update);
router.delete('/:id', rbacMiddleware('ADMIN', 'SUPER_ADMIN'), subjectController.delete);

export default router;
