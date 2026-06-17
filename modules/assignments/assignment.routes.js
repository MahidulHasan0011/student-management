import { Router } from 'express';
import { controller } from './assignment.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);


router.post("/", rbacMiddleware("HEAD_MASTER", "ADMIN"), controller.assignSubject);

router.get("/", controller.getAssignments);
router.put("/:id", rbacMiddleware("HEAD_MASTER", "ADMIN"), controller.updateAssignment);
router.delete("/:id", rbacMiddleware("HEAD_MASTER", "ADMIN"), controller.deleteAssignment);

export default router;