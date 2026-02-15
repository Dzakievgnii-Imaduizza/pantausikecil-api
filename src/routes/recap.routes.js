const express = require("express");
const { requireAuth } = require("../middleware/auth");
const recapController = require("../controllers/recap.controller");

const router = express.Router();

router.get("/", requireAuth, recapController.recap);

module.exports = router;
