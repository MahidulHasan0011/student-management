import { Router } from 'express';
import { rankingController } from './ranking.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

// ── Read ──
router.get('/:classId/:academicSessionId', rbacMiddleware('RANKING_READ'), rankingController.getRanking);
router.get('/:classId/:academicSessionId/history', rbacMiddleware('RANKING_READ'), rankingController.getHistory);
router.get('/:classId/:academicSessionId/audit', rbacMiddleware('RANKING_READ'), rankingController.getAuditLog);

// ── Generate (manual, প্রথমবার) ──
router.post('/generate-roll', rbacMiddleware('RANKING_GENERATE'), rankingController.generateRoll);

// ── Admin-only: unlock + recalculate ──
router.post('/recalculate', rbacMiddleware('RANKING_RECALCULATE'), rankingController.recalculate);
router.post('/unlock', rbacMiddleware('RANKING_UNLOCK'), rankingController.unlock);

export default router;
