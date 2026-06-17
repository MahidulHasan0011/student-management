
import { Router } from 'express';
import { controller } from './academic-sessions.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post("/", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.createSession);
router.get("/", controller.getAllSessions);
router.patch("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.updateSession);
router.delete("/:id", rbacMiddleware("ADMIN"), controller.deleteSession);

export default router;