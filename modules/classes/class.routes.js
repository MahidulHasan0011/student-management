import { Router } from "express";
import { classController } from "./class.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { rbacMiddleware } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/", rbacMiddleware("CLASS_READ"), classController.getAll);
router.get("/:id", rbacMiddleware("CLASS_READ"), classController.getById);
router.get("/:id/sections", rbacMiddleware("CLASS_READ"), classController.getWithSections);
router.post("/", rbacMiddleware("CLASS_CREATE"), classController.create);
router.patch("/:id", rbacMiddleware("CLASS_UPDATE"), classController.update);
router.delete("/:id", rbacMiddleware("CLASS_DELETE"), classController.delete);

export default router;