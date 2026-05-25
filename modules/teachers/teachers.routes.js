const express = require("express");
const router = express.Router();

const controller = require("./teachers.controller");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/rbac");

router.post("/", auth, authorize("ADMIN", "HEAD_MASTER"), controller.createTeacher);
router.get("/", auth, controller.getTeacher);
router.put("/:id", auth, authorize("ADMIN", "HEAD_MASTER"), controller.updateTeacher);
router.delete("/:id", auth, authorize("ADMIN", "HEAD_MASTER"), controller.deleteTeacher);
module.exports = router;