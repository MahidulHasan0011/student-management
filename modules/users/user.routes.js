import { Router } from 'express';
import { controller } from './user.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post("/", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.createUser);
router.get("/", controller.getUsers);
router.put("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.updateUser);
router.delete("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.deleteUser);

export default router;