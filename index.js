const express = require("express");
const router  = express.Router();


// import routes
const studentRoutes = require("./routes/studentRoutes");

// use routes
router.use("/api/students", studentRoutes);

module.exports = router;