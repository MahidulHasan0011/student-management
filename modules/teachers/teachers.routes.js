import { Router } from 'express';
import { controller } from './teachers.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post("/", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.createTeacher);
router.get("/", controller.getTeacher);
router.get("/:id", controller.getTeacherById);
router.put("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.updateTeacher);
router.delete("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), controller.deleteTeacher);

export default router;