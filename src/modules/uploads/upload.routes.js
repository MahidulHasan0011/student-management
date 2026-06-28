import { Router } from 'express';
import { uploadController } from './upload.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware); // সব route-এ JWT লাগবে

// ── write/confirm ──
router.post('/generate-url', rbacMiddleware('UPLOAD_CREATE'), uploadController.generateUrl);
router.post('/confirm', rbacMiddleware('UPLOAD_CREATE'), uploadController.confirm);
router.post('/bulk-delete', rbacMiddleware('UPLOAD_DELETE'), uploadController.bulkDelete);

// ── read ── (static আগে, তারপর param)
router.get('/', rbacMiddleware('UPLOAD_READ'), uploadController.getAll);
router.get('/:id', rbacMiddleware('UPLOAD_READ'), uploadController.getById);
router.get('/:id/download', rbacMiddleware('UPLOAD_READ'), uploadController.download);

// ── delete/restore ──
router.delete('/:id', rbacMiddleware('UPLOAD_DELETE'), uploadController.delete);
router.patch('/:id/restore', rbacMiddleware('UPLOAD_RESTORE'), uploadController.restore);

export default router;
