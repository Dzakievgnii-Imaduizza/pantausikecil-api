const express = require("express");
const { requireAuth } = require("../middleware/auth");
const controller = require("../controllers/pemeriksaan.controller");

const router = express.Router();

router.post("/anak/:anakId/pemeriksaan", requireAuth, controller.createForAnak);
router.get("/anak/:anakId/pemeriksaan", requireAuth, controller.listForAnak);
router.get("/anak/:anakId/jumlah", requireAuth, controller.jumlah);
router.get("/pemeriksaan/:id", requireAuth, controller.detail);
router.delete("/pemeriksaan/:id", requireAuth, controller.remove);
// router.get("/jumlah",requireAuth,  controller.jumlah);

module.exports = router;
