import { Router } from 'express';
import { userController } from "./user.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { rbacMiddleware } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

router.patch("/me/password", userController.changePassword);
router.get("/", rbacMiddleware("ADMIN", "SUPER_ADMIN"), userController.getAll);
router.get("/:id", rbacMiddleware("ADMIN", "SUPER_ADMIN"), userController.getById);
router.post("/", rbacMiddleware("ADMIN", "SUPER_ADMIN"), userController.create);
router.patch("/:id", rbacMiddleware("ADMIN", "SUPER_ADMIN"), userController.update);
router.delete("/:id", rbacMiddleware("ADMIN", "SUPER_ADMIN"), userController.delete);
router.patch("/:id/reset-password", rbacMiddleware("ADMIN", "SUPER_ADMIN"), userController.resetPassword);
router.patch("/:id/toggle-active", rbacMiddleware("ADMIN", "SUPER_ADMIN"), userController.toggleActive);

export default router;