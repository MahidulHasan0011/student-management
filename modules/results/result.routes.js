const express = require("express");
const router = express.Router();

const controller = require("./result.controller");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/rbac");

router.post("/", auth, authorize("HEAD_MASTER", "ADMIN"), controller.createResult);

router.get("/", auth, controller.getResults);
router.put("/:id", auth, authorize("HEAD_MASTER", "ADMIN"), controller.updateResult);
router.delete("/:id", auth, authorize("HEAD_MASTER", "ADMIN"), controller.deleteResult);

module.exports = router;