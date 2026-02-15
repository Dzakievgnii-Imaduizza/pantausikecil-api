const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const controller = require("../controllers/adminUser.controller");

const router = express.Router();

router.get("/users", requireAuth, requireRole("admin"), controller.list);
router.post("/users", requireAuth, requireRole("admin"), controller.create);
router.get("/users/:id", requireAuth, requireRole("admin"), controller.detail);
router.patch("/users/:id", requireAuth, requireRole("admin"), controller.update);
router.delete("/users/:id", requireAuth, requireRole("admin"), controller.remove);

module.exports = router;
