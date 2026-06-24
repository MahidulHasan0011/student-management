import { Router } from 'express';
import { examController } from './exam.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', rbacMiddleware('EXAM_READ'), examController.getAll);
router.get('/:id', rbacMiddleware('EXAM_READ'), examController.getById);
router.post('/', rbacMiddleware('EXAM_CREATE'), examController.create);
router.patch('/:id', rbacMiddleware('EXAM_UPDATE'), examController.update);
router.delete('/:id', rbacMiddleware('EXAM_DELETE'), examController.delete);

// Publish/unpublish — শুধু এই দুটো কাজের জন্য EXAM_UPDATE permission যথেষ্ট
router.patch('/:id/publish', rbacMiddleware('EXAM_UPDATE'), examController.publish);
router.patch('/:id/unpublish', rbacMiddleware('EXAM_UPDATE'), examController.unpublish);

export default router;
