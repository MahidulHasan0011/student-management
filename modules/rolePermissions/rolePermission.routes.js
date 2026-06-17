import { Router } from 'express';
import { controller } from './rolePermission.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post("/", rbacMiddleware("HEAD_MASTER", "ADMIN"), controller.assignRolePermission);
router.get("/", controller.getRolePermissions);
router.put("/:id", rbacMiddleware("HEAD_MASTER", "ADMIN"), controller.updateRolePermission);
router.delete("/:id", rbacMiddleware("HEAD_MASTER", "ADMIN"), controller.deleteRolePermission);

export default router;