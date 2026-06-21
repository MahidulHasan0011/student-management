import { Router } from 'express';
import { controller } from './enrollment.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);


router.post("/", rbacMiddleware("SUPER_ADMIN", "ADMIN"), controller.assignEnrollment);

router.get("/", controller.getEnrollments);
router.put("/:id", rbacMiddleware("SUPER_ADMIN", "ADMIN"), controller.updateEnrollment);
router.delete("/:id", rbacMiddleware("SUPER_ADMIN", "ADMIN"), controller.deleteEnrollment);

export default router;