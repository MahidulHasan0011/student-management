import { Router } from 'express';
import { permissionController  } from './permission.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post("/", rbacMiddleware("SUPER_ADMIN", "ADMIN"), permissionController.create);
router.get("/", permissionController.getAll);
router.get("/:id", rbacMiddleware("SUPER_ADMIN", "ADMIN"), permissionController.getById);
router.patch("/:id", rbacMiddleware("SUPER_ADMIN", "ADMIN"), permissionController.update);
router.delete("/:id", rbacMiddleware("SUPER_ADMIN", "ADMIN"), permissionController.delete);

export default router;