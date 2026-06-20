import { Router } from 'express';
import { roleController } from './role.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post("/", rbacMiddleware("HEAD_MASTER", "ADMIN"), roleController.create);
router.get("/:id", rbacMiddleware("HEAD_MASTER", "ADMIN"), roleController.getById);
router.get("/", rbacMiddleware("HEAD_MASTER", "ADMIN"), roleController.getAll);
router.patch("/:id", rbacMiddleware("HEAD_MASTER", "ADMIN"), roleController.update);
router.delete("/:id", rbacMiddleware("HEAD_MASTER", "ADMIN"), roleController.delete);
router.put("/:id/permissions", rbacMiddleware("HEAD_MASTER", "ADMIN"), roleController.syncPermissions);

export default router;