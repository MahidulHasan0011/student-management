const express = require("express");
const router  = express.Router();


// import routes
const studentRoutes = require("./modules/students/student.Routes");

// use routes
router.use("/api/students", studentRoutes);

module.exports = router;