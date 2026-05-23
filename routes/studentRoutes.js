const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
//create student
router.post("/", studentController.createStudent);
//get all students
router.get("/all",studentController.getAllStudents);

module.exports = router;