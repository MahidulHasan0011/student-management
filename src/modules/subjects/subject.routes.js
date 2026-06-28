import { Router } from 'express';
import { subjectController } from './subject.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', rbacMiddleware('SUBJECT_READ'), subjectController.getAll);
router.get('/:id', rbacMiddleware('SUBJECT_READ'), subjectController.getById);
router.post('/', rbacMiddleware('SUBJECT_CREATE'), subjectController.create);
router.patch('/:id', rbacMiddleware('SUBJECT_UPDATE'), subjectController.update);
router.delete('/:id', rbacMiddleware('SUBJECT_DELETE'), subjectController.delete);

export default router;
