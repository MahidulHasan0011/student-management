import { Router } from "express";
import { teacherController } from "./teacher.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { rbacMiddleware } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/", rbacMiddleware("ADMIN", "SUPER_ADMIN"), teacherController.getAll);
router.get("/:id", rbacMiddleware("ADMIN", "SUPER_ADMIN"), teacherController.getById);
router.get("/:id/assignments", rbacMiddleware("ADMIN", "SUPER_ADMIN"), teacherController.getWithAssignments);
router.post("/", rbacMiddleware("ADMIN", "SUPER_ADMIN"), teacherController.create);
router.patch("/:id", rbacMiddleware("ADMIN", "SUPER_ADMIN"), teacherController.update);
router.delete("/:id", rbacMiddleware("ADMIN", "SUPER_ADMIN"), teacherController.delete);

export default router;