const express = require("express");
const router = express.Router();
const studentController = require("./student.controller");
//create student
router.post("/", studentController.createStudent);
//get all students
router.get("/all",studentController.getAllStudents);

module.exports = router;