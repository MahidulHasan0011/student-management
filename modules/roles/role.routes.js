import { Router } from 'express';
import { roleController } from './role.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', rbacMiddleware('ROLE_READ'), roleController.getAll);
router.get('/:id', rbacMiddleware('ROLE_READ'), roleController.getById);
router.post('/', rbacMiddleware('ROLE_CREATE'), roleController.create);
router.patch('/:id', rbacMiddleware('ROLE_UPDATE'), roleController.update);
router.delete('/:id', rbacMiddleware('ROLE_DELETE'), roleController.delete);
router.put('/:id/permissions', rbacMiddleware('ROLE_UPDATE'), roleController.syncPermissions);

export default router;
