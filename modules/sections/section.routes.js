
import { Router } from "express";
import { sectionController } from "./section.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { rbacMiddleware } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/", rbacMiddleware("ADMIN", "HEAD_MASTER"), sectionController.getAll);
router.get("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), sectionController.getById);
router.get("/:id/occupancy", rbacMiddleware("ADMIN", "HEAD_MASTER"), sectionController.getOccupancy);
router.post("/", rbacMiddleware("ADMIN", "HEAD_MASTER"), sectionController.create);
router.patch("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), sectionController.update);
router.delete("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), sectionController.delete);

export default router;