import { Router } from 'express';
import { controller } from './student.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { rbacMiddleware } from '../../middlewares/rbac.middleware.js';

const router = Router();
router.use(authMiddleware);

router.post("/", rbacMiddleware("ADMIN", "SUPER_ADMIN"), controller.createStudent);
router.get("/", controller.getAllStudents);
router.get("/:id", controller.getStudentById);
router.patch("/:id", rbacMiddleware("ADMIN", "SUPER_ADMIN"), controller.updateStudent);
router.delete("/:id", rbacMiddleware("ADMIN"), controller.deleteStudent);

export default router;