import { Router } from 'express';
import { controller } from './subject-assignment.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);


router.post("/", rbacMiddleware("SUPER_ADMIN", "ADMIN"), controller.assignSubject);

router.get("/", controller.getAssignments);
router.put("/:id", rbacMiddleware("SUPER_ADMIN", "ADMIN"), controller.updateAssignment);
router.delete("/:id", rbacMiddleware("SUPER_ADMIN", "ADMIN"), controller.deleteAssignment);

export default router;