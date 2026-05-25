const express = require("express");
const router = express.Router();

const controller = require("./classes.controller");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/rbac");


router.post("/", auth, authorize("ADMIN", "HEAD_MASTER"), controller.createClass);
router.get("/", auth, controller.getClasses);
router.put("/:id", auth, authorize("ADMIN", "HEAD_MASTER"), controller.updateClass);
router.delete("/:id", auth, authorize("ADMIN", "HEAD_MASTER"), controller.deleteClass);
module.exports = router;