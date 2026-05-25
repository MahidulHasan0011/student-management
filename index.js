const express = require("express");
const router  = express.Router();


// import routes
const studentRoutes = require("./modules/students/student.Routes");
const academicSessionRoutes = require("./modules/academic-sessions/academic-sessions.routes");
const teacherRoutes = require("./modules/teachers/teachers.routes");
const classRoutes = require("./modules/classes/classes.routes");
const subjectRoutes = require("./modules/subjects/subject.routes");
const sectionRoutes = require("./modules/sections/section.routes");
const assignmentRoutes = require("./modules/assignments/assignment.routes");
const enrollmentRoutes = require("./modules/enrollments/enrollment.routes");
const examRoutes = require("./modules/exams/exam.routes");
const resultRoutes = require("./modules/results/result.routes");
const userRoutes = require("./modules/users/user.routes");
const roleRoutes = require("./modules/roles/role.routes");
const permissionRoutes = require("./modules/permissions/permission.routes");
const rolePermissionRoutes = require("./modules/rolePermissions/rolePermission.routes");


// use routes
router.use("/api/v1/students", studentRoutes);
router.use("/api/v1/academic-sessions", academicSessionRoutes);
router.use("/api/v1/teachers", teacherRoutes);
router.use("/api/v1/classes", classRoutes);
router.use("/api/v1/subjects", subjectRoutes);
router.use("/api/v1/sections", sectionRoutes);
router.use("/api/v1/assignments", assignmentRoutes);
router.use("/api/v1/enrollments", enrollmentRoutes);
router.use("/api/v1/exams", examRoutes);
router.use("/api/v1/results", resultRoutes);

router.use("/api/v1/users", userRoutes);

router.use("/api/v1/roles", roleRoutes);

router.use("/api/v1/permissions", permissionRoutes);

router.use("/api/v1/role-permissions", rolePermissionRoutes);

module.exports = router;