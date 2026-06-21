import { Router } from "express";
import { classController } from "./class.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { rbacMiddleware } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/", rbacMiddleware("ADMIN", "SUPER_ADMIN"), classController.getAll);
router.get("/:id", rbacMiddleware("ADMIN", "SUPER_ADMIN"), classController.getById);
router.get("/:id/sections", rbacMiddleware("ADMIN", "SUPER_ADMIN"), classController.getWithSections);
router.post("/", rbacMiddleware("ADMIN", "SUPER_ADMIN"), classController.create);
router.patch("/:id", rbacMiddleware("ADMIN", "SUPER_ADMIN"), classController.update);
router.delete("/:id", rbacMiddleware("ADMIN", "SUPER_ADMIN"), classController.delete);

export default router;