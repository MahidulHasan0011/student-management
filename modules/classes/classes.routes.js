import { Router } from 'express';
import { controller } from './classes.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);



router.post("/", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.createClass);
router.get("/", controller.getClasses);
router.put("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.updateClass);
router.delete("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.deleteClass);

export default router;