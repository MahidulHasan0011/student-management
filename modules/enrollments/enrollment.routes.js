const express = require("express");
const router = express.Router();

const controller = require("./enrollment.controller");
const auth = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/rbac.middleware");

router.post("/", auth, authorize("HEAD_MASTER", "ADMIN"), controller.assignEnrollment);

router.get("/", auth, controller.getEnrollments);
router.put("/:id", auth, authorize("HEAD_MASTER", "ADMIN"), controller.updateEnrollment);
router.delete("/:id", auth, authorize("HEAD_MASTER", "ADMIN"), controller.deleteEnrollment);

module.exports = router;