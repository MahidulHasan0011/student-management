import { Router } from 'express';
import { academicSessionController } from './academic-session.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

// নির্দিষ্ট /active route অবশ্যই /:id-এর আগে থাকতে হবে — নাহলে "active"-কে id ভাবে নিবে
router.get('/active', rbacMiddleware('SESSION_READ'), academicSessionController.getActive);
router.get('/', rbacMiddleware('SESSION_READ'), academicSessionController.getAll);
router.get('/:id', rbacMiddleware('SESSION_READ'), academicSessionController.getById);
router.post('/', rbacMiddleware('SESSION_CREATE'), academicSessionController.create);
router.patch('/:id', rbacMiddleware('SESSION_UPDATE'), academicSessionController.update);
router.delete('/:id', rbacMiddleware('SESSION_DELETE'), academicSessionController.delete);
router.patch('/:id/activate', rbacMiddleware('SESSION_UPDATE'), academicSessionController.activate);
router.patch(
  '/:id/deactivate',
  rbacMiddleware('SESSION_UPDATE'),
  academicSessionController.deactivate,
);
router.patch(
  '/:id/admission-test',
  rbacMiddleware('SESSION_UPDATE'),
  academicSessionController.toggleAdmissionTest,
);

export default router;
