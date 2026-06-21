import { Router } from 'express';
import { roleController } from './role.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post("/", rbacMiddleware("SUPER_ADMIN", "ADMIN"), roleController.create);
router.get("/:id", rbacMiddleware("SUPER_ADMIN", "ADMIN"), roleController.getById);
router.get("/", rbacMiddleware("SUPER_ADMIN", "ADMIN"), roleController.getAll);
router.patch("/:id", rbacMiddleware("SUPER_ADMIN", "ADMIN"), roleController.update);
router.delete("/:id", rbacMiddleware("SUPER_ADMIN", "ADMIN"), roleController.delete);
router.put("/:id/permissions", rbacMiddleware("SUPER_ADMIN", "ADMIN"), roleController.syncPermissions);

export default router;