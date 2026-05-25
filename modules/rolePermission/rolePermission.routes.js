const router = require("express");
const router = express.Router();

const controller = require("./rolePermission.controller");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/rbac");

router.post("/", auth, authorize("HEAD_MASTER", "ADMIN"), controller.assignRolePermission);

router.get("/", auth, controller.getRolePermissions);
router.put("/:id", auth, authorize("HEAD_MASTER", "ADMIN"), controller.updateRolePermission);
router.delete("/:id", auth, authorize("HEAD_MASTER", "ADMIN"), controller.deleteRolePermission);

module.exports = router;