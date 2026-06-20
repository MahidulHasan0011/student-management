

import { Router } from "express";
import { subjectController } from "./subject.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { rbacMiddleware } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/", rbacMiddleware("ADMIN", "HEAD_MASTER"), subjectController.getAll);
router.get("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), subjectController.getById);
router.post("/", rbacMiddleware("ADMIN", "HEAD_MASTER"), subjectController.create);
router.patch("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), subjectController.update);
router.delete("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), subjectController.delete);

export default router;