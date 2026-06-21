
import { Router } from "express";
import { sectionController } from "./section.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { rbacMiddleware } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/", rbacMiddleware("SECTION_READ"), sectionController.getAll);
router.get("/:id", rbacMiddleware("SECTION_READ"), sectionController.getById);
router.get("/:id/occupancy", rbacMiddleware("SECTION_READ"), sectionController.getOccupancy);
router.post("/", rbacMiddleware("SECTION_CREATE"), sectionController.create);
router.patch("/:id", rbacMiddleware("SECTION_UPDATE"), sectionController.update);
router.delete("/:id", rbacMiddleware("SECTION_DELETE"), sectionController.delete);

export default router;