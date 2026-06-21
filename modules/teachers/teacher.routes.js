import { Router } from "express";
import { teacherController } from "./teacher.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { rbacMiddleware } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/", rbacMiddleware("TEACHER_READ"), teacherController.getAll);
router.get("/:id", rbacMiddleware("TEACHER_READ"), teacherController.getById);
router.get("/:id/assignments", rbacMiddleware("TEACHER_READ"), teacherController.getWithAssignments);
router.post("/", rbacMiddleware("TEACHER_CREATE"), teacherController.create);
router.patch("/:id", rbacMiddleware("TEACHER_UPDATE"), teacherController.update);
router.delete("/:id", rbacMiddleware("TEACHER_DELETE"), teacherController.delete);

export default router;