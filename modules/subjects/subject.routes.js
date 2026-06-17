import { Router } from 'express';
import { controller } from './subject.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post("/", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.createSubject);
router.get("/", controller.getSubjects);
router.put("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.updateSubject);
router.delete("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.deleteSubject);

export default router;