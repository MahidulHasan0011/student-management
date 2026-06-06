const express = require("express");
const router = express.Router();

const controller = require("./section.controller");
const auth = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/rbac.middleware");


router.post("/", auth, authorize("ADMIN", "HEAD_MASTER"), controller.createSection);
router.get("/", auth, controller.getSections);
router.put("/:id", auth, authorize("ADMIN", "HEAD_MASTER"), controller.updateSection);
router.delete("/:id", auth, authorize("ADMIN", "HEAD_MASTER"), controller.deleteSection);
module.exports = router;