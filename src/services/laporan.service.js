const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { generateFileName } = require("../utils/fileName.util");

// ⬇️ PENTING: keluar dari src/
const STORAGE_PATH = path.resolve(process.cwd(), "storage", "laporan");

exports.generateAndSaveExcel = async (posyanduId) => {
  // Pastikan folder ada
  if (!fs.existsSync(STORAGE_PATH)) {
    fs.mkdirSync(STORAGE_PATH, { recursive: true });
  }

  // Panggil n8n
  const response = await axios.post(
    process.env.N8N_WEBHOOK_RECAP_URL,
    { posyanduId },
    { responseType: "arraybuffer" } // ✔️ cocok untuk XLSX
  );

  const fileName = generateFileName(posyanduId);
  const filePath = path.join(STORAGE_PATH, fileName);

  // Simpan file
  fs.writeFileSync(filePath, response.data);

  console.log("FILE DISIMPAN KE:", filePath);
  console.log("FILE EXISTS:", fs.existsSync(filePath)); // harus true

  return { fileName, filePath };
};
