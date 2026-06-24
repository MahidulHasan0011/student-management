import { Router } from 'express';
import { userController } from './user.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.patch('/me/password', userController.changePassword);

router.get('/', rbacMiddleware('USER_READ'), userController.getAll);
router.get('/:id', rbacMiddleware('USER_READ'), userController.getById);
router.post('/', rbacMiddleware('USER_CREATE'), userController.create);
router.patch('/:id', rbacMiddleware('USER_UPDATE'), userController.update);
router.delete('/:id', rbacMiddleware('USER_DELETE'), userController.delete);

router.patch('/:id/reset-password', rbacMiddleware('USER_UPDATE'), userController.resetPassword);
router.patch('/:id/toggle-active', rbacMiddleware('USER_UPDATE'), userController.toggleActive);

export default router;
