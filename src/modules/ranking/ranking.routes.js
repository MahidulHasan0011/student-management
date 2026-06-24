import { Router } from 'express';
import { rankingController } from './ranking.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

// NOTE: RANKING_TRIGGER permission টা এখনো database/seed.sql-এ নেই —
// super-admin বা যে role-এ এটা assign করা হবে, তাকে আগে seed.sql / role-permission API দিয়ে দিতে হবে।
// Auto-trigger + RECALCULATE flow phase 7-এ আলাদা task হিসেবে আছে।

const router = Router();
router.use(authMiddleware);

router.post('/trigger', rbacMiddleware('RANKING_TRIGGER'), rankingController.trigger);

export default router;
