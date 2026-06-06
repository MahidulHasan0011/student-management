const express = require("express");
const router = express.Router();

const controller = require("./subject.controller");
const auth = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/rbac.middleware");

router.post("/", auth, authorize("ADMIN", "HEAD_MASTER"), controller.createSubject);
router.get("/", auth, controller.getSubjects);
router.put("/:id", auth, authorize("ADMIN", "HEAD_MASTER"), controller.updateSubject);
router.delete("/:id", auth, authorize("ADMIN", "HEAD_MASTER"), controller.deleteSubject);
module.exports = router;