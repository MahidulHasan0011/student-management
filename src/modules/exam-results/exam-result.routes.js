import { Router } from 'express';
import { examResultController } from './exam-result.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', rbacMiddleware('EXAM_RESULT_READ'), examResultController.getAll);
router.get('/:id', rbacMiddleware('EXAM_RESULT_READ'), examResultController.getById);
router.get('/exam/:examId', rbacMiddleware('EXAM_RESULT_READ'), examResultController.getByExam);
router.get(
  '/exam/:examId/student/:studentId/marksheet',
  rbacMiddleware('EXAM_RESULT_READ'),
  examResultController.getMarksheet,
);

router.post('/', rbacMiddleware('EXAM_RESULT_CREATE'), examResultController.create);
router.post('/bulk', rbacMiddleware('EXAM_RESULT_CREATE'), examResultController.bulkCreate);
router.patch('/:id', rbacMiddleware('EXAM_RESULT_UPDATE'), examResultController.update);
router.delete('/:id', rbacMiddleware('EXAM_RESULT_UPDATE'), examResultController.delete);

export default router;
