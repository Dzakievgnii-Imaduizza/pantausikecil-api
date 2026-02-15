const express = require("express");
const { requireAuth } = require("../middleware/auth");
const anakController = require("../controllers/anak.controller");

const router = express.Router();

router.get("/", requireAuth, anakController.list);
router.post("/", requireAuth, anakController.create);
router.get("/:id", requireAuth, anakController.detail);
router.delete("/:id", requireAuth, anakController.remove);
router.patch("/:id", requireAuth, anakController.update);

module.exports = router;
