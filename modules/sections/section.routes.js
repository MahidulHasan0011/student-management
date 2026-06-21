
import { Router } from "express";
import { sectionController } from "./section.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { rbacMiddleware } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/", rbacMiddleware("ADMIN", "SUPER_ADMIN"), sectionController.getAll);
router.get("/:id", rbacMiddleware("ADMIN", "SUPER_ADMIN"), sectionController.getById);
router.get("/:id/occupancy", rbacMiddleware("ADMIN", "SUPER_ADMIN"), sectionController.getOccupancy);
router.post("/", rbacMiddleware("ADMIN", "SUPER_ADMIN"), sectionController.create);
router.patch("/:id", rbacMiddleware("ADMIN", "SUPER_ADMIN"), sectionController.update);
router.delete("/:id", rbacMiddleware("ADMIN", "SUPER_ADMIN"), sectionController.delete);

export default router;