import { Router } from "express";
import { academicSessionController } from "./academic-session.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { rbacMiddleware } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

// নির্দিষ্ট /active route অবশ্যই /:id-এর আগে থাকতে হবে — নাহলে "active"-কে id ভাবে নিবে
router.get("/active", rbacMiddleware("ADMIN", "SUPER_ADMIN"), academicSessionController.getActive);

router.get("/", rbacMiddleware("ADMIN", "SUPER_ADMIN"), academicSessionController.getAll);
router.get("/:id", rbacMiddleware("ADMIN", "SUPER_ADMIN"), academicSessionController.getById);
router.post("/", rbacMiddleware("ADMIN", "SUPER_ADMIN"), academicSessionController.create);
router.patch("/:id", rbacMiddleware("ADMIN", "SUPER_ADMIN"), academicSessionController.update);
router.delete("/:id", rbacMiddleware("ADMIN", "SUPER_ADMIN"), academicSessionController.delete);

router.patch("/:id/activate", rbacMiddleware("ADMIN", "SUPER_ADMIN"), academicSessionController.activate);
router.patch("/:id/deactivate", rbacMiddleware("ADMIN", "SUPER_ADMIN"), academicSessionController.deactivate);
router.patch("/:id/admission-test", rbacMiddleware("ADMIN", "SUPER_ADMIN"), academicSessionController.toggleAdmissionTest);

export default router;