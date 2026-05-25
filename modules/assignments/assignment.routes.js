const express = require("express");
const router = express.Router();

const controller = require("./assignment.controller");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/rbac");

router.post("/", auth, authorize("HEAD_MASTER", "ADMIN"), controller.assignSubject);

router.get("/", auth, controller.getAssignments);
router.put("/:id", auth, authorize("HEAD_MASTER", "ADMIN"), controller.updateAssignment);
router.delete("/:id", auth, authorize("HEAD_MASTER", "ADMIN"), controller.deleteAssignment);

module.exports = router;