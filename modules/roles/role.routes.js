import { Router } from 'express';
import { controller } from './role.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post("/", rbacMiddleware("HEAD_MASTER", "ADMIN"), controller.createRole);
router.get("/", controller.getRoles);
router.put("/:id", rbacMiddleware("HEAD_MASTER", "ADMIN"), controller.updateRole);
router.delete("/:id", rbacMiddleware("HEAD_MASTER", "ADMIN"), controller.deleteRole);

export default router;