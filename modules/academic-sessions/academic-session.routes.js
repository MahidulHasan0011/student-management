import { Router } from "express";
import { academicSessionController } from "./academic-session.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { rbacMiddleware } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

// নির্দিষ্ট /active route অবশ্যই /:id-এর আগে থাকতে হবে — নাহলে "active"-কে id ভাবে নিবে
router.get("/active", rbacMiddleware("ADMIN", "HEAD_MASTER"), academicSessionController.getActive);

router.get("/", rbacMiddleware("ADMIN", "HEAD_MASTER"), academicSessionController.getAll);
router.get("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), academicSessionController.getById);
router.post("/", rbacMiddleware("ADMIN", "HEAD_MASTER"), academicSessionController.create);
router.patch("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), academicSessionController.update);
router.delete("/:id", rbacMiddleware("ADMIN", "HEAD_MASTER"), academicSessionController.delete);

router.patch("/:id/activate", rbacMiddleware("ADMIN", "HEAD_MASTER"), academicSessionController.activate);
router.patch("/:id/deactivate", rbacMiddleware("ADMIN", "HEAD_MASTER"), academicSessionController.deactivate);
router.patch("/:id/admission-test", rbacMiddleware("ADMIN", "HEAD_MASTER"), academicSessionController.toggleAdmissionTest);

export default router;