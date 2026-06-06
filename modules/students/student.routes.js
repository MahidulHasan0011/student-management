const express = require("express");
const router = express.Router();
const controller = require("./student.controller");
const auth = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/rbac.middleware");

router.post("/", auth, authorize("ADMIN", "HEAD_MASTER"), controller.createStudent);
router.get("/", auth, controller.getAllStudents);
router.get("/:id", auth, controller.getStudentById);
router.patch("/:id", auth,authorize("ADMIN", "HEAD_MASTER"), controller.updateStudent);
router.delete("/:id", auth, authorize("ADMIN"), controller.deleteStudent);

module.exports = router;