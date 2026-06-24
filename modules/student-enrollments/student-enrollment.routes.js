import { Router } from 'express';
import { studentEnrollmentController } from './student-enrollment.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', rbacMiddleware('ENROLLMENT_READ'), studentEnrollmentController.getAll);
router.get('/:id', rbacMiddleware('ENROLLMENT_READ'), studentEnrollmentController.getById);
router.post('/', rbacMiddleware('ENROLLMENT_CREATE'), studentEnrollmentController.create);
router.patch('/:id', rbacMiddleware('ENROLLMENT_UPDATE'), studentEnrollmentController.update);
router.delete('/:id', rbacMiddleware('ENROLLMENT_UPDATE'), studentEnrollmentController.delete);

export default router;
