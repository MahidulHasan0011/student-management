import { Router } from "express";
import { classController } from "./class.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { rbacMiddleware } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/", rbacMiddleware("ADMIN", "HEAD_MASTER"), classController.getAll);
router.get("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), classController.getById);
router.get("/:id/sections", rbacMiddleware("ADMIN", "HEAD_MASTER"), classController.getWithSections);
router.post("/", rbacMiddleware("ADMIN", "HEAD_MASTER"), classController.create);
router.patch("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), classController.update);
router.delete("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), classController.delete);

export default router;