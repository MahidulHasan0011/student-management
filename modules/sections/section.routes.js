import { Router } from 'express';
import { controller } from './section.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post("/", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.createSection);
router.get("/", controller.getSections);
router.put("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.updateSection);
router.delete("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.deleteSection);
export default router;