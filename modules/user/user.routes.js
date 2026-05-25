const router = require("express");
const router = express.Router();

const controller = require("./user.controller");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/rbac");

router.post("/", auth, authorize("HEAD_MASTER", "ADMIN"), controller.createUser);

router.get("/", auth, controller.getUsers);
router.put("/:id", auth, authorize("HEAD_MASTER", "ADMIN"), controller.updateUser);
router.delete("/:id", auth, authorize("HEAD_MASTER", "ADMIN"), controller.deleteUser);

module.exports = router;