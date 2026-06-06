const express = require("express");
const router = express.Router();
const controller = require("./academic-sessions.controller");
const auth = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/rbac.middleware");

router.post("/", auth, authorize("ADMIN", "HEAD_MASTER"), controller.createSession);
router.get("/", auth, controller.getAllSessions);
router.patch("/:id", auth, authorize("ADMIN", "HEAD_MASTER"), controller.updateSession);
router.delete("/:id", auth, authorize("ADMIN"), controller.deleteSession);

module.exports = router;