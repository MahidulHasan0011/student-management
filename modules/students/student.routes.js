const express = require("express");
const router = express.Router();
const studentController = require("./student.controller");

router.post("/", studentController.createStudent);
router.get("/", studentController.getAllStudents);
router.get("/:id", studentController.getStudentById);
router.get("/:id", studentController.updateStudent);
router.get("/:id", studentController.deleteStudent);

module.exports = router;