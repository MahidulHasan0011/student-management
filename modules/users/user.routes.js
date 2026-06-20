import { Router } from 'express';
import { userController } from "./user.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { rbacMiddleware } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

router.patch("/me/password", userController.changePassword);
router.get("/", rbacMiddleware("ADMIN", "HEAD_MASTER"), userController.getAll);
router.get("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), userController.getById);
router.post("/", rbacMiddleware("ADMIN", "HEAD_MASTER"), userController.create);
router.patch("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), userController.update);
router.delete("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), userController.delete);
router.patch("/:id/reset-password", rbacMiddleware("ADMIN", "HEAD_MASTER"), userController.resetPassword);
router.patch("/:id/toggle-active", rbacMiddleware("ADMIN", "HEAD_MASTER"), userController.toggleActive);

export default router;