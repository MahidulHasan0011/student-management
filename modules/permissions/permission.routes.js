import { Router } from 'express';
import { controller } from './permission.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post("/", rbacMiddleware("HEAD_MASTER", "ADMIN"), controller.createPermission);
router.get("/", controller.getPermissions);
router.put("/:id", rbacMiddleware("HEAD_MASTER", "ADMIN"), controller.updatePermission);
router.delete("/:id", rbacMiddleware("HEAD_MASTER", "ADMIN"), controller.deletePermission);

export default router;