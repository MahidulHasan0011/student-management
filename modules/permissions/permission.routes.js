import { Router } from 'express';
import { permissionController  } from './permission.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post("/", rbacMiddleware("HEAD_MASTER", "ADMIN"), permissionController.create);
router.get("/", permissionController.getAll);
router.get("/:id", rbacMiddleware("HEAD_MASTER", "ADMIN"), permissionController.getById);
router.patch("/:id", rbacMiddleware("HEAD_MASTER", "ADMIN"), permissionController.update);
router.delete("/:id", rbacMiddleware("HEAD_MASTER", "ADMIN"), permissionController.delete);

export default router;