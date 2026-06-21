import { Router } from 'express';
import { permissionController  } from './permission.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get("/", rbacMiddleware("PERMISSION_READ"), permissionController.getAll);
router.get("/:id", rbacMiddleware("PERMISSION_READ"), permissionController.getById);
router.post("/", rbacMiddleware("PERMISSION_CREATE"), permissionController.create);
router.patch("/:id", rbacMiddleware("PERMISSION_UPDATE"), permissionController.update);
router.delete("/:id", rbacMiddleware("PERMISSION_DELETE"), permissionController.delete);

export default router;