import { Router } from "express";
import { rolePermissionController } from "./role-permission.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { rbacMiddleware } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authMiddleware);

// দেখা — সবার জন্য ROLE_READ যথেষ্ট, আলাদা permission বানানোর দরকার নেই
router.get("/role/:roleId", rbacMiddleware("ROLE_READ"), rolePermissionController.getByRole);
router.get("/permission/:permissionId", rbacMiddleware("ROLE_READ"), rolePermissionController.getByPermission);

// পরিবর্তন — ROLE_UPDATE permission থাকা লাগবে (role.routes.js-এর syncPermissions-এর মতো)
router.post("/", rbacMiddleware("ROLE_UPDATE"), rolePermissionController.assign);
router.post("/bulk", rbacMiddleware("ROLE_UPDATE"), rolePermissionController.assignBulk);
router.delete("/", rbacMiddleware("ROLE_UPDATE"), rolePermissionController.revoke);

export default router;




