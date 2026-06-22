import { Router } from "express";
import { studentController } from "./student.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { rbacMiddleware } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/", rbacMiddleware("STUDENT_READ"), studentController.getAll);
router.get("/:id", rbacMiddleware("STUDENT_READ"), studentController.getById);
router.get("/:id/enrollment", rbacMiddleware("STUDENT_READ"), studentController.getWithEnrollment);
router.post("/", rbacMiddleware("STUDENT_CREATE"), studentController.create);
router.patch("/:id", rbacMiddleware("STUDENT_UPDATE"), studentController.update);
router.delete("/:id", rbacMiddleware("STUDENT_DELETE"), studentController.delete);

export default router;