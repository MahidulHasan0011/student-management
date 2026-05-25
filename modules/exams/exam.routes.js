const express = require("express");
const router = express.Router();

const controller = require("./exam.controller");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/rbac");

router.post("/", auth, authorize("HEAD_MASTER", "ADMIN"), controller.createExam);

router.get("/", auth, controller.getExams);
router.put("/:id", auth, authorize("HEAD_MASTER", "ADMIN"), controller.updateExam);
router.delete("/:id", auth, authorize("HEAD_MASTER", "ADMIN"), controller.deleteExam);

module.exports = router;