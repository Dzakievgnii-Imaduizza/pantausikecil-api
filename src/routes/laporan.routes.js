const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/auth");
const laporanController = require("../controllers/laporan.controller");

// trigger + receive laporan dari n8n
router.post(
  "/",
  requireAuth,
  laporanController.generateLaporan
);

router.get(
  "/download/:filename",
  laporanController.downloadLaporan
);

module.exports = router;
