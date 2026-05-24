const express = require("express");
const router  = express.Router();


// import routes
const studentRoutes = require("./modules/students/student.Routes");
const academicSessionRoutes = require("./modules/academic-sessions/academic-sessions.routes");


// use routes
router.use("/api/students", studentRoutes);
router.use("/api/academic-sessions", academicSessionRoutes);

module.exports = router;