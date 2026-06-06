const express = require("express");
const router = express.Router();

const controller = require("./role.controller");
const auth = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/rbac.middleware");

router.post("/", auth, authorize("HEAD_MASTER", "ADMIN"), controller.createRole);

router.get("/", auth, controller.getRoles);
router.put("/:id", auth, authorize("HEAD_MASTER", "ADMIN"), controller.updateRole);
router.delete("/:id", auth, authorize("HEAD_MASTER", "ADMIN"), controller.deleteRole);

module.exports = router;