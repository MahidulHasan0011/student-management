import { Router } from 'express';
import { subjectAssignmentController } from './subject-assignment.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', rbacMiddleware('SUBJECT_ASSIGNMENT_READ'), subjectAssignmentController.getAll);
router.get('/:id', rbacMiddleware('SUBJECT_ASSIGNMENT_READ'), subjectAssignmentController.getById);
router.get(
  '/teacher/:teacherId',
  rbacMiddleware('SUBJECT_ASSIGNMENT_READ'),
  subjectAssignmentController.getByTeacher,
);
router.post('/', rbacMiddleware('SUBJECT_ASSIGNMENT_CREATE'), subjectAssignmentController.create);
router.patch(
  '/:id',
  rbacMiddleware('SUBJECT_ASSIGNMENT_UPDATE'),
  subjectAssignmentController.update,
);
router.delete(
  '/:id',
  rbacMiddleware('SUBJECT_ASSIGNMENT_DELETE'),
  subjectAssignmentController.delete,
);

export default router;
