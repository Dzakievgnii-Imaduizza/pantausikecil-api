const laporanService = require("../services/laporan.service");
const path = require("path");
const fs = require("fs");

exports.generateLaporan = async (req, res) => {
  try {
    const body = req.body || {}; // ⬅️ penting
    const { posyanduId } = body;

    if (!posyanduId) {
      return res.status(400).json({
        message: "posyanduId wajib dikirim",
      });
    }

    const result = await laporanService.generateAndSaveExcel(posyanduId);

    res.json({
      message: "Laporan berhasil dibuat",
      fileName: result.fileName,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal membuat laporan",
      error: error.message,
    });
  }
};

exports.downloadLaporan = (req, res) => {
  const { filename } = req.params;

  const baseDir = path.resolve(process.cwd(), "storage", "laporan");
  const filePath = path.resolve(baseDir, filename);

 console.log("FILE DISIMPAN KE:", filePath);
 console.log("FILE EXISTS:", fs.existsSync(filePath));


  // 🔒 Security: cegah path traversal
  if (!filePath.startsWith(baseDir)) {
    return res.status(400).json({ message: "Invalid file path" });
  }

  // ❌ File tidak ada
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      message: "File tidak ditemukan",
      debug: filePath,
    });
  }

  // ✅ Kirim file
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: "Gagal mengunduh file" });
    }
  });
};
