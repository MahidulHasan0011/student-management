const express = require("express");
const router = express.Router();

const controller = require("./permission.controller");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/rbac");

router.post("/", auth, authorize("HEAD_MASTER", "ADMIN"), controller.createPermission);

router.get("/", auth, controller.getPermissions);
router.put("/:id", auth, authorize("HEAD_MASTER", "ADMIN"), controller.updatePermission);
router.delete("/:id", auth, authorize("HEAD_MASTER", "ADMIN"), controller.deletePermission);

module.exports = router;